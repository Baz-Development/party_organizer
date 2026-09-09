import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { guestInviteUrl } from "@/lib/event-url";
import type { Guest, RsvpStatus } from "@/lib/types";
import { DbError, UNIQUE_VIOLATION, toRsvpError } from "./errors";
import { toGuest, type GuestRow } from "./mappers";

type Client = SupabaseClient<Database>;

/** O evento a que o convidado pertence — precisa do `id` e do `slug` para
 * montar o link de convite compartilhável. */
export type EventRef = { id: string; slug: string };

/** Extrai o token de convite de uma linha de `guests` com `guest_invites`
 * embutido (`select("*, guest_invites(token)")`). */
function inviteTokenOf(row: unknown): string | undefined {
  const gi = (row as { guest_invites?: { token: string } | { token: string }[] | null })
    .guest_invites;
  if (!gi) return undefined;
  return Array.isArray(gi) ? gi[0]?.token : gi.token;
}

/** Mapeia a linha para `Guest` já resolvendo `inviteUrl` a partir do token. */
function toGuestWithInvite(event: EventRef, row: unknown): Guest {
  const token = inviteTokenOf(row);
  return toGuest(row as GuestRow, token ? guestInviteUrl(event, token) : undefined);
}

/** Índice de deduplicação compara e-mail em minúsculas; nome mantém a caixa
 * como digitado, só sem espaço nas pontas. */
function normalizeEmail(email: string | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

/**
 * Acesso a convidados e RSVP.
 *
 * `listGuests`/`createGuest`/`updateGuest`/`deleteGuest`/`importGuests`/
 * `exportGuests` recebem o client autenticado de quem administra o evento —
 * a RLS de `guests_manage` escopa. `getGuestByInviteToken` e `submitRsvp`
 * chamam as funções `security definer` via `client.rpc`, e por isso funcionam
 * também com o client anônimo do convidado sem conta.
 */

export interface GuestStats {
  convidados: number;
  confirmados: number;
  recusados: number;
  pendentes: number;
  totalPessoas: number;
  criancas: number;
  restricoes: number;
  taxaResposta: number;
}

export function computeGuestStats(guests: Guest[]): GuestStats {
  const confirmados = guests.filter((g) => g.status === "confirmado");
  const recusados = guests.filter((g) => g.status === "recusado");
  const pendentes = guests.filter((g) => g.status === "pendente");

  return {
    convidados: guests.length,
    confirmados: confirmados.length,
    recusados: recusados.length,
    pendentes: pendentes.length,
    totalPessoas: confirmados.reduce((acc, g) => acc + 1 + g.companions + g.kids, 0),
    criancas: confirmados.reduce((acc, g) => acc + g.kids, 0),
    restricoes: guests.filter((g) => !!g.dietary).length,
    taxaResposta: guests.length
      ? Math.round(((confirmados.length + recusados.length) / guests.length) * 100)
      : 0,
  };
}

export async function listGuests(
  client: Client,
  event: EventRef,
  options: { status?: RsvpStatus } = {},
): Promise<Guest[]> {
  let query = client
    .from("guests")
    .select("*, guest_invites(token)")
    .eq("event_id", event.id)
    .order("name");
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) throw new DbError(error.message, "desconhecido");

  return (data ?? []).map((row) => toGuestWithInvite(event, row));
}

export interface CreateGuestInput {
  name: string;
  group?: string;
  email?: string;
  phone?: string;
}

export async function createGuest(
  client: Client,
  event: EventRef,
  input: CreateGuestInput,
): Promise<Guest> {
  const { data, error } = await client
    .from("guests")
    .insert({
      event_id: event.id,
      name: input.name,
      group_name: input.group ?? null,
      email: normalizeEmail(input.email),
      phone: input.phone ?? null,
    })
    .select("*")
    .single();

  if (error) throw new DbError(error.message, "desconhecido");

  const { data: invite } = await client
    .from("guest_invites")
    .insert({ guest_id: data.id })
    .select("token")
    .single();

  return toGuest(
    data as GuestRow,
    invite ? guestInviteUrl(event, invite.token) : undefined,
  );
}

export interface UpdateGuestInput {
  name?: string;
  group?: string;
  email?: string;
  phone?: string;
}

export async function updateGuest(
  client: Client,
  guestId: string,
  input: UpdateGuestInput,
): Promise<Guest> {
  const patch: Database["public"]["Tables"]["guests"]["Update"] = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.group !== undefined) patch.group_name = input.group;
  if (input.email !== undefined) patch.email = normalizeEmail(input.email);
  if (input.phone !== undefined) patch.phone = input.phone;

  const { data, error } = await client
    .from("guests")
    .update(patch)
    .eq("id", guestId)
    .select("*")
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) throw new DbError("Convidado não encontrado.", "nao-encontrado");

  return toGuest(data as GuestRow);
}

export async function deleteGuest(client: Client, guestId: string): Promise<void> {
  const { error, count } = await client
    .from("guests")
    .delete({ count: "exact" })
    .eq("id", guestId);

  if (error) throw new DbError(error.message, "desconhecido");
  if (!count) throw new DbError("Convidado não encontrado.", "nao-encontrado");
}

export interface ImportGuestRow {
  name?: string;
  group?: string;
  email?: string;
  phone?: string;
}

export interface ImportResult {
  accepted: Guest[];
  rejected: { row: ImportGuestRow; reason: string }[];
}

/**
 * Linha a linha, não em lote: `guests_event_name_email_idx` é um índice único
 * *parcial* (`where email is not null`), e o inferidor de `ON CONFLICT` do
 * Postgres só usa índice parcial como alvo quando a query repete o mesmo
 * `WHERE` — o que o `upsert` do PostgREST não permite expressar. Por isso a
 * deduplicação acontece aqui: tenta inserir, e se a constraint acusar
 * duplicata, busca e reaproveita o registro existente.
 */
export async function importGuests(
  client: Client,
  event: EventRef,
  rows: ImportGuestRow[],
): Promise<ImportResult> {
  const accepted: Guest[] = [];
  const rejected: ImportResult["rejected"] = [];

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) {
      rejected.push({ row, reason: "Nome ausente." });
      continue;
    }

    const email = normalizeEmail(row.email);

    const { data, error } = await client
      .from("guests")
      .insert({
        event_id: event.id,
        name,
        group_name: row.group ?? null,
        email,
        phone: row.phone ?? null,
      })
      .select("*")
      .single();

    if (!error) {
      const { data: invite } = await client
        .from("guest_invites")
        .insert({ guest_id: data.id })
        .select("token")
        .single();
      accepted.push(
        toGuest(data as GuestRow, invite ? guestInviteUrl(event, invite.token) : undefined),
      );
      continue;
    }

    if (error.code !== UNIQUE_VIOLATION || !email) {
      rejected.push({ row, reason: error.message });
      continue;
    }

    const { data: existing, error: selectError } = await client
      .from("guests")
      .select("*, guest_invites(token)")
      .eq("event_id", event.id)
      .eq("name", name)
      .eq("email", email)
      .maybeSingle();

    if (selectError || !existing) {
      rejected.push({ row, reason: "Convidado duplicado, mas não foi possível reaproveitá-lo." });
      continue;
    }

    accepted.push(toGuestWithInvite(event, existing));
  }

  return { accepted, rejected };
}

export async function exportGuests(client: Client, event: EventRef): Promise<Guest[]> {
  return listGuests(client, event);
}

export interface InvitedGuest {
  guestId: string;
  eventId: string;
  name: string;
  status: RsvpStatus;
  companions: number;
  kids: number;
  dietary: string | null;
}

export async function getGuestByInviteToken(
  client: Client,
  token: string,
): Promise<InvitedGuest | null> {
  const { data, error } = await client
    .rpc("get_guest_by_invite_token", { p_token: token })
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) return null;

  return {
    guestId: data.guest_id,
    eventId: data.event_id,
    name: data.name,
    status: data.status,
    companions: data.companions,
    kids: data.kids,
    dietary: data.dietary,
  };
}

export interface SubmitRsvpInput {
  status: RsvpStatus;
  companions: number;
  kids: number;
  dietary?: string;
}

export async function submitRsvp(
  client: Client,
  token: string,
  input: SubmitRsvpInput,
): Promise<Guest> {
  const { data, error } = await client
    .rpc("submit_rsvp", {
      p_token: token,
      p_status: input.status,
      p_companions: input.companions,
      p_kids: input.kids,
      p_dietary: (input.dietary ?? null) as string,
    })
    .single();

  if (error) throw toRsvpError(error);

  return toGuest(data as GuestRow);
}

/**
 * RSVP de quem não está na lista, pelo link de auto-cadastro do evento
 * (`?lista=<token>`). A função `security definer` recusa se o token não bate,
 * o evento não está publicado, o módulo de RSVP está desligado ou o prazo
 * passou.
 */
export async function submitSelfSignupRsvp(
  client: Client,
  eventSlug: string,
  signupToken: string,
  name: string,
  input: SubmitRsvpInput,
): Promise<Guest> {
  const { data, error } = await client
    .rpc("submit_self_signup_rsvp", {
      p_event_slug: eventSlug,
      p_signup_token: signupToken,
      p_name: name,
      p_status: input.status,
      p_companions: input.companions,
      p_kids: input.kids,
      p_dietary: (input.dietary ?? null) as string,
    })
    .single();

  if (error) throw toRsvpError(error);

  return toGuest(data as GuestRow);
}
