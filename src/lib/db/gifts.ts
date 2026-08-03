import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Gift } from "@/lib/types";
import { DbError } from "./errors";
import { centsToReais, toGift, type GiftRow } from "./mappers";

type Client = SupabaseClient<Database>;

/**
 * Acesso ao catálogo de presentes.
 *
 * A mesma consulta serve o convidado sem conta e quem administra o evento: a
 * RLS de `gifts` deixa qualquer um ler um evento publicado, e a de
 * `gift_reservations` só deixa quem administra o evento enxergar a linha
 * embutida. Por isso `reservedBy` chega vazio para o convidado e preenchido
 * para o anfitrião sem este arquivo precisar saber quem está perguntando —
 * a fronteira de privacidade é a RLS, não um `if` aqui.
 */

type GiftRowWithReservations = GiftRow & {
  gift_reservations: { buyer_name: string; status: string; created_at: string }[];
};

const GIFT_SELECT = "*, gift_reservations(buyer_name, status, created_at)";

function pickReservedBy(reservations: GiftRowWithReservations["gift_reservations"]): string | undefined {
  const relevant = reservations
    .filter((r) => r.status === "ativa" || r.status === "concluida")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return relevant[0]?.buyer_name;
}

export async function listGifts(client: Client, eventId: string): Promise<Gift[]> {
  const { data, error } = await client
    .from("gifts")
    .select(GIFT_SELECT)
    .eq("event_id", eventId)
    .order("created_at");

  if (error) throw new DbError(error.message, "desconhecido");

  return (data as unknown as GiftRowWithReservations[]).map((row) =>
    toGift(row, pickReservedBy(row.gift_reservations)),
  );
}

export interface GiftsSummary {
  total: number;
  presenteados: number;
  arrecadado: number;
}

export async function getGiftsSummary(client: Client, eventId: string): Promise<GiftsSummary> {
  const [{ count: total, error: totalError }, { count: presenteados, error: presenteadosError }, { data: paid, error: paidError }] =
    await Promise.all([
      client.from("gifts").select("id", { count: "exact", head: true }).eq("event_id", eventId),
      client
        .from("gifts")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "comprado"),
      // Só pagamento confirmado entra no total arrecadado
      // ("Requirement: Acompanhamento no painel").
      client.from("payments").select("amount_cents").eq("event_id", eventId).eq("status", "pago"),
    ]);

  if (totalError) throw new DbError(totalError.message, "desconhecido");
  if (presenteadosError) throw new DbError(presenteadosError.message, "desconhecido");
  if (paidError) throw new DbError(paidError.message, "desconhecido");

  const arrecadadoCents = (paid ?? []).reduce((acc, p) => acc + p.amount_cents, 0);

  return {
    total: total ?? 0,
    presenteados: presenteados ?? 0,
    arrecadado: centsToReais(arrecadadoCents),
  };
}

export interface CreateGiftInput {
  name: string;
  category: string;
  /** Já em centavos — a conversão de reais acontece em `src/lib/validation/gift.ts`. */
  price: number;
  store?: string;
  note?: string;
  quotaTarget?: number;
}

export async function createGift(client: Client, eventId: string, input: CreateGiftInput): Promise<Gift> {
  const { data, error } = await client
    .from("gifts")
    .insert({
      event_id: eventId,
      name: input.name,
      category: input.category,
      price_cents: input.price,
      store: input.store ?? null,
      note: input.note ?? null,
      quota_target_cents: input.quotaTarget ?? null,
    })
    .select("*")
    .single();

  if (error) throw new DbError(error.message, "desconhecido");

  return toGift(data as GiftRow);
}

export interface UpdateGiftInput {
  name?: string;
  category?: string;
  price?: number;
  store?: string;
  note?: string;
}

export async function updateGift(client: Client, giftId: string, input: UpdateGiftInput): Promise<Gift> {
  const patch: Database["public"]["Tables"]["gifts"]["Update"] = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.category !== undefined) patch.category = input.category;
  if (input.price !== undefined) patch.price_cents = input.price;
  if (input.store !== undefined) patch.store = input.store;
  if (input.note !== undefined) patch.note = input.note;

  const { data, error } = await client.from("gifts").update(patch).eq("id", giftId).select("*").maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) throw new DbError("Presente não encontrado.", "nao-encontrado");

  return toGift(data as GiftRow);
}

export async function deleteGift(client: Client, giftId: string): Promise<void> {
  const { error, count } = await client.from("gifts").delete({ count: "exact" }).eq("id", giftId);

  if (error) throw new DbError(error.message, "desconhecido");
  if (!count) throw new DbError("Presente não encontrado.", "nao-encontrado");
}
