import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type {
  Raffle,
  RaffleParticipant,
  RaffleParticipantMode,
  RafflePrize,
  RaffleResult,
  RaffleSummary,
} from "@/lib/types";
import type { RaffleAction } from "@/lib/validation/raffle";
import { DbError, toRaffleError } from "./errors";

type Client = SupabaseClient<Database>;
type Tables = Database["public"]["Tables"];

/**
 * Acesso aos sorteios de prêmios.
 *
 * Todas as funções recebem o client autenticado de quem administra o evento:
 * a RLS (`can_manage_event`) escopa as leituras e escritas diretas, e as
 * funções `security definer` (`start_raffle`, `draw_raffle_winner`, …) checam
 * a mesma coisa por dentro. O vencedor é escolhido sempre pelo banco — este
 * arquivo nunca grava um resultado diretamente.
 */

const IMAGE_URL_TTL_SECONDS = 3600;

/** Ids por requisição em `.in(...)` — a lista vai na query string do PostgREST. */
const ID_BATCH = 150;

type RaffleRow = Tables["raffles"]["Row"];
type PrizeRow = Tables["raffle_prizes"]["Row"];
type ParticipantRow = Tables["raffle_participants"]["Row"];
type ResultRow = Tables["raffle_results"]["Row"];

type RaffleRowWithCounts = RaffleRow & {
  raffle_participants: { count: number }[];
  raffle_prizes: Pick<PrizeRow, "quantity">[];
  raffle_results: Pick<ResultRow, "status">[];
};

type RaffleRowWithContent = RaffleRow & {
  raffle_participants: ParticipantRow[];
  raffle_prizes: PrizeRow[];
  raffle_results: ResultRow[];
};

function toSummary(
  row: RaffleRow,
  counts: { participants: number; winnerSlots: number; drawn: number },
): RaffleSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    participantMode: row.participant_mode,
    alternatesCount: row.alternates_count,
    participantCount: counts.participants,
    winnerSlots: counts.winnerSlots,
    drawnCount: counts.drawn,
    createdAt: row.created_at,
  };
}

function toPrize(row: PrizeRow, imageUrl?: string): RafflePrize {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    quantity: row.quantity,
    position: row.position,
    imagePath: row.image_path ?? undefined,
    imageUrl,
  };
}

function toParticipant(row: ParticipantRow): RaffleParticipant {
  return { id: row.id, guestId: row.guest_id ?? undefined, name: row.display_name };
}

function toResult(row: ResultRow, names: Map<string, string>): RaffleResult {
  return {
    id: row.id,
    participantId: row.participant_id,
    name: names.get(row.participant_id) ?? "",
    prizeId: row.prize_id ?? undefined,
    sequence: row.sequence,
    status: row.status,
    drawnAt: row.drawn_at,
  };
}

/**
 * Quantos convidados concorreriam se o sorteio começasse agora, por modo.
 * Só importa para sorteio automático ainda aberto: depois de começar, a
 * lista gravada em `raffle_participants` é a definitiva.
 */
async function countEligibleGuests(
  client: Client,
  eventId: string,
): Promise<Record<Exclude<RaffleParticipantMode, "selecionados">, number>> {
  const [{ count: todos, error: todosError }, { count: confirmados, error: confError }] =
    await Promise.all([
      client.from("guests").select("id", { count: "exact", head: true }).eq("event_id", eventId),
      client
        .from("guests")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "confirmado"),
    ]);
  if (todosError) throw new DbError(todosError.message, "desconhecido");
  if (confError) throw new DbError(confError.message, "desconhecido");
  return { todos: todos ?? 0, confirmados: confirmados ?? 0 };
}

function participantCountOf(
  row: RaffleRow,
  stored: number,
  eligible: Awaited<ReturnType<typeof countEligibleGuests>> | null,
): number {
  if (row.participant_mode === "selecionados" || row.status !== "aberto" || !eligible) return stored;
  return eligible[row.participant_mode];
}

const byPosition = (a: PrizeRow, b: PrizeRow) =>
  a.position - b.position || a.created_at.localeCompare(b.created_at);

// --- Sorteios ------------------------------------------------------------

export async function listRaffles(client: Client, eventId: string): Promise<RaffleSummary[]> {
  const { data, error } = await client
    .from("raffles")
    .select("*, raffle_participants(count), raffle_prizes(quantity), raffle_results(status)")
    .eq("event_id", eventId)
    .order("created_at");

  if (error) throw new DbError(error.message, "desconhecido");

  const rows = data as unknown as RaffleRowWithCounts[];
  const eligible = rows.some((r) => r.participant_mode !== "selecionados" && r.status === "aberto")
    ? await countEligibleGuests(client, eventId)
    : null;

  return rows.map((row) =>
    toSummary(row, {
      participants: participantCountOf(row, row.raffle_participants[0]?.count ?? 0, eligible),
      winnerSlots: row.raffle_prizes.reduce((acc, p) => acc + p.quantity, 0),
      drawn: row.raffle_results.filter((r) => r.status === "valido").length,
    }),
  );
}

export async function getRaffle(
  client: Client,
  eventId: string,
  raffleId: string,
): Promise<Raffle | null> {
  const { data, error } = await client
    .from("raffles")
    .select("*, raffle_participants(*), raffle_prizes(*), raffle_results(*)")
    .eq("event_id", eventId)
    .eq("id", raffleId)
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) return null;

  const row = data as unknown as RaffleRowWithContent;

  const prizes = await Promise.all(
    [...row.raffle_prizes].sort(byPosition).map(async (prize) => {
      let imageUrl: string | undefined;
      if (prize.image_path) {
        const { data: signed } = await client.storage
          .from("event-media")
          .createSignedUrl(prize.image_path, IMAGE_URL_TTL_SECONDS);
        imageUrl = signed?.signedUrl;
      }
      return toPrize(prize, imageUrl);
    }),
  );

  const participants = [...row.raffle_participants]
    .sort((a, b) => a.display_name.localeCompare(b.display_name, "pt-BR"))
    .map(toParticipant);
  const names = new Map(row.raffle_participants.map((p) => [p.id, p.display_name]));
  const results = [...row.raffle_results]
    .sort((a, b) => a.sequence - b.sequence)
    .map((r) => toResult(r, names));

  const eligible =
    row.participant_mode !== "selecionados" && row.status === "aberto"
      ? await countEligibleGuests(client, eventId)
      : null;

  return {
    ...toSummary(row, {
      participants: participantCountOf(row, participants.length, eligible),
      winnerSlots: prizes.reduce((acc, p) => acc + p.quantity, 0),
      drawn: results.filter((r) => r.status === "valido").length,
    }),
    prizes,
    participants,
    results,
  };
}

export interface CreateRaffleInput {
  title: string;
  description?: string;
  alternatesCount?: number;
}

export async function createRaffle(
  client: Client,
  eventId: string,
  input: CreateRaffleInput,
): Promise<string> {
  const { data, error } = await client
    .from("raffles")
    .insert({
      event_id: eventId,
      title: input.title,
      description: input.description || null,
      alternates_count: input.alternatesCount ?? 0,
    })
    .select("id")
    .single();

  if (error) throw toRaffleError(error);
  return data.id;
}

export interface UpdateRaffleInput {
  title?: string;
  description?: string;
  alternatesCount?: number;
  participantMode?: RaffleParticipantMode;
}

export async function updateRaffle(
  client: Client,
  eventId: string,
  raffleId: string,
  input: UpdateRaffleInput,
): Promise<void> {
  const patch: Tables["raffles"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.alternatesCount !== undefined) patch.alternates_count = input.alternatesCount;
  if (input.participantMode !== undefined) patch.participant_mode = input.participantMode;

  const { data, error } = await client
    .from("raffles")
    .update(patch)
    .eq("event_id", eventId)
    .eq("id", raffleId)
    .select("id")
    .maybeSingle();

  if (error) throw toRaffleError(error);
  if (!data) throw new DbError("Sorteio não encontrado.", "nao-encontrado");
}

export async function deleteRaffle(client: Client, eventId: string, raffleId: string): Promise<void> {
  const { error, count } = await client
    .from("raffles")
    .delete({ count: "exact" })
    .eq("event_id", eventId)
    .eq("id", raffleId);

  if (error) throw toRaffleError(error);
  if (!count) throw new DbError("Sorteio não encontrado.", "nao-encontrado");
}

/** Confere que o sorteio pertence ao evento da rota antes de chamar uma RPC por id. */
async function assertRaffleInEvent(client: Client, eventId: string, raffleId: string): Promise<void> {
  const { data, error } = await client
    .from("raffles")
    .select("id")
    .eq("event_id", eventId)
    .eq("id", raffleId)
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) throw new DbError("Sorteio não encontrado.", "nao-encontrado");
}

// --- Prêmios -------------------------------------------------------------

export interface CreateRafflePrizeInput {
  name: string;
  description?: string;
  quantity?: number;
  imagePath?: string;
}

export async function createRafflePrize(
  client: Client,
  eventId: string,
  raffleId: string,
  input: CreateRafflePrizeInput,
): Promise<void> {
  await assertRaffleInEvent(client, eventId, raffleId);

  const { data: last } = await client
    .from("raffle_prizes")
    .select("position")
    .eq("raffle_id", raffleId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await client.from("raffle_prizes").insert({
    raffle_id: raffleId,
    event_id: eventId,
    name: input.name,
    description: input.description || null,
    quantity: input.quantity ?? 1,
    image_path: input.imagePath ?? null,
    position: (last?.position ?? -1) + 1,
  });

  if (error) throw toRaffleError(error);
}

export interface UpdateRafflePrizeInput {
  name?: string;
  description?: string;
  quantity?: number;
  /** `null` remove a foto. */
  imagePath?: string | null;
}

export async function updateRafflePrize(
  client: Client,
  eventId: string,
  raffleId: string,
  prizeId: string,
  input: UpdateRafflePrizeInput,
): Promise<void> {
  const patch: Tables["raffle_prizes"]["Update"] = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.quantity !== undefined) patch.quantity = input.quantity;
  if (input.imagePath !== undefined) patch.image_path = input.imagePath;

  const { data, error } = await client
    .from("raffle_prizes")
    .update(patch)
    .eq("event_id", eventId)
    .eq("raffle_id", raffleId)
    .eq("id", prizeId)
    .select("id")
    .maybeSingle();

  if (error) throw toRaffleError(error);
  if (!data) throw new DbError("Prêmio não encontrado.", "nao-encontrado");
}

export async function deleteRafflePrize(
  client: Client,
  eventId: string,
  raffleId: string,
  prizeId: string,
): Promise<void> {
  const { error, count } = await client
    .from("raffle_prizes")
    .delete({ count: "exact" })
    .eq("event_id", eventId)
    .eq("raffle_id", raffleId)
    .eq("id", prizeId);

  if (error) throw toRaffleError(error);
  if (!count) throw new DbError("Prêmio não encontrado.", "nao-encontrado");
}

/** Grava a ordem de sorteio dos prêmios: `ids[0]` sai primeiro. */
export async function reorderRafflePrizes(
  client: Client,
  eventId: string,
  raffleId: string,
  ids: string[],
): Promise<void> {
  const results = await Promise.all(
    ids.map((id, position) =>
      client
        .from("raffle_prizes")
        .update({ position })
        .eq("event_id", eventId)
        .eq("raffle_id", raffleId)
        .eq("id", id),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) throw toRaffleError(failed.error);
}

// --- Participantes -------------------------------------------------------

/**
 * Define a lista de participantes a partir dos convidados marcados: inclui
 * quem é novo (copiando o nome atual do convidado) e remove quem foi
 * desmarcado. Quem continua marcado não é tocado. Recusado pelo banco
 * (`sorteio_bloqueado`) depois que o sorteio começou.
 */
export async function setRaffleParticipants(
  client: Client,
  eventId: string,
  raffleId: string,
  guestIds: string[],
): Promise<void> {
  await assertRaffleInEvent(client, eventId, raffleId);

  const wanted = new Set(guestIds);

  const { data: current, error: currentError } = await client
    .from("raffle_participants")
    .select("id, guest_id")
    .eq("raffle_id", raffleId);
  if (currentError) throw new DbError(currentError.message, "desconhecido");

  const existing = new Set((current ?? []).map((p) => p.guest_id).filter(Boolean));
  const toRemove = (current ?? []).filter((p) => !p.guest_id || !wanted.has(p.guest_id));
  const toAdd = [...wanted].filter((id) => !existing.has(id));

  for (let i = 0; i < toRemove.length; i += ID_BATCH) {
    const { error } = await client
      .from("raffle_participants")
      .delete()
      .in(
        "id",
        toRemove.slice(i, i + ID_BATCH).map((p) => p.id),
      );
    if (error) throw toRaffleError(error);
  }

  if (toAdd.length > 0) {
    // Nome vem do convidado (nunca do cliente), e só de convidado deste evento.
    const { data: guests, error: guestsError } = await client
      .from("guests")
      .select("id, name")
      .eq("event_id", eventId);
    if (guestsError) throw new DbError(guestsError.message, "desconhecido");

    const names = new Map((guests ?? []).map((g) => [g.id, g.name]));
    if (toAdd.some((id) => !names.has(id))) {
      throw new DbError("Participante não encontrado neste evento.", "invalido");
    }

    const { error } = await client.from("raffle_participants").insert(
      toAdd.map((guestId) => ({
        raffle_id: raffleId,
        event_id: eventId,
        guest_id: guestId,
        display_name: names.get(guestId)!,
      })),
    );
    if (error) throw toRaffleError(error);
  }
}

// --- Condução do sorteio -------------------------------------------------

const ACTION_RPC = {
  iniciar: "start_raffle",
  reabrir: "reopen_raffle",
  recomecar: "reset_raffle",
  encerrar: "finish_raffle",
} as const satisfies Record<RaffleAction, keyof Database["public"]["Functions"]>;

export async function runRaffleAction(
  client: Client,
  eventId: string,
  raffleId: string,
  action: RaffleAction,
): Promise<void> {
  await assertRaffleInEvent(client, eventId, raffleId);

  const { error } = await client.rpc(ACTION_RPC[action], { p_raffle_id: raffleId });
  if (error) throw toRaffleError(error);
}

export interface RaffleDraw {
  resultId: string;
  participantId: string;
  name: string;
  /** `undefined` = suplente. */
  prizeId?: string;
  sequence: number;
  /** Vagas que ainda faltam depois deste nome (0 = sorteio encerrado). */
  remaining: number;
}

export async function drawRaffleWinner(
  client: Client,
  eventId: string,
  raffleId: string,
): Promise<RaffleDraw> {
  await assertRaffleInEvent(client, eventId, raffleId);

  const { data, error } = await client.rpc("draw_raffle_winner", { p_raffle_id: raffleId });
  if (error) throw toRaffleError(error);

  const row = data?.[0];
  if (!row) throw new DbError("Não foi possível sortear.", "desconhecido");

  return {
    resultId: row.result_id,
    participantId: row.participant_id,
    name: row.display_name,
    prizeId: row.prize_id ?? undefined,
    sequence: row.sequence,
    remaining: row.remaining,
  };
}

export async function markRaffleResultAbsent(
  client: Client,
  eventId: string,
  raffleId: string,
  resultId: string,
): Promise<void> {
  const { data, error: findError } = await client
    .from("raffle_results")
    .select("id")
    .eq("event_id", eventId)
    .eq("raffle_id", raffleId)
    .eq("id", resultId)
    .maybeSingle();
  if (findError) throw new DbError(findError.message, "desconhecido");
  if (!data) throw new DbError("Resultado não encontrado.", "nao-encontrado");

  const { error } = await client.rpc("mark_raffle_result_absent", { p_result_id: resultId });
  if (error) throw toRaffleError(error);
}
