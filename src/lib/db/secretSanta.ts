import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { SecretSantaParticipant } from "@/lib/types";
import { DbError, toSecretSantaError } from "./errors";
import { toSecretSantaParticipant } from "./mappers";

type Client = SupabaseClient<Database>;

/**
 * Acesso ao amigo secreto: adesão, wishlist, restrições de par, sorteio e
 * revelação.
 *
 * `joinSecretSanta`/`updateSecretSantaWishlist`/`getMySecretSantaParticipation`/
 * `getMySecretSanta` chamam funções `security definer` via `client.rpc` e por
 * isso funcionam com o client anônimo do convidado sem conta, identificado só
 * pelo token de convite. `listSecretSantaParticipants`/`getSecretSantaStatus`/
 * `addSecretSantaExclusion`/`removeSecretSantaExclusion`/`runSecretSantaDraw`/
 * `redoSecretSantaDraw` recebem o client autenticado de quem administra o
 * evento — a RLS e a checagem de `can_manage_event` dentro das funções
 * escopam. Em nenhum caminho um par (`secret_santa_assignments`) é lido
 * diretamente por este módulo: só `get_my_secret_santa` o resolve, dentro do
 * banco.
 */

// --- Convidado (via token) ---------------------------------------------

export async function getMySecretSantaParticipation(
  client: Client,
  token: string,
): Promise<{ displayName: string; wishlist: string[]; joinedAt: string } | null> {
  const { data, error } = await client.rpc("get_my_secret_santa_participation", {
    p_token: token,
  });

  if (error) throw toSecretSantaError(error);

  const row = data?.[0];
  if (!row) return null;

  return { displayName: row.display_name, wishlist: row.wishlist ?? [], joinedAt: row.joined_at };
}

export async function joinSecretSanta(
  client: Client,
  token: string,
  displayName: string,
): Promise<void> {
  const { error } = await client.rpc("join_secret_santa", {
    p_token: token,
    p_display_name: displayName,
  });

  if (error) throw toSecretSantaError(error);
}

export async function updateSecretSantaWishlist(
  client: Client,
  token: string,
  wishlist: string[],
): Promise<void> {
  const { error } = await client.rpc("update_secret_santa_wishlist", {
    p_token: token,
    p_wishlist: wishlist,
  });

  if (error) throw toSecretSantaError(error);
}

export interface SecretSantaReveal {
  drawn: boolean;
  receiverName?: string;
  receiverWishlist?: string[];
  revealedAt?: string;
}

export async function getMySecretSanta(client: Client, token: string): Promise<SecretSantaReveal> {
  const { data, error } = await client.rpc("get_my_secret_santa", { p_token: token });

  if (error) throw toSecretSantaError(error);

  const row = data?.[0];
  if (!row || !row.drawn) return { drawn: false };

  return {
    drawn: true,
    receiverName: row.receiver_name ?? undefined,
    receiverWishlist: row.receiver_wishlist ?? [],
    revealedAt: row.revealed_at ?? undefined,
  };
}

// --- Anfitrião (autenticado) --------------------------------------------

export interface SecretSantaStatus {
  participantCount: number;
  drawnAt?: string;
}

export async function getSecretSantaStatus(
  client: Client,
  eventId: string,
): Promise<SecretSantaStatus> {
  const { data, error } = await client.rpc("get_secret_santa_status", { p_event_id: eventId });

  if (error) throw toSecretSantaError(error);

  const row = data?.[0];
  return { participantCount: Number(row?.participant_count ?? 0), drawnAt: row?.drawn_at ?? undefined };
}

/**
 * Lista participantes para a tela de gestão. Nunca inclui um par — só o que
 * a policy de `secret_santa_participants` expõe (nome, data de entrada) mais
 * o estado agregado do sorteio (`hasDrawn` é o mesmo para todos: se o evento
 * já sorteou ou não).
 */
export async function listSecretSantaParticipants(
  client: Client,
  eventId: string,
): Promise<SecretSantaParticipant[]> {
  const { data, error } = await client
    .from("secret_santa_participants")
    .select("id, display_name, joined_at")
    .eq("event_id", eventId)
    .order("joined_at");

  if (error) throw new DbError(error.message, "desconhecido");

  const { drawnAt } = await getSecretSantaStatus(client, eventId);

  return (data ?? []).map((row) => toSecretSantaParticipant(row, [], drawnAt != null));
}

export async function addSecretSantaExclusion(
  client: Client,
  eventId: string,
  participantAId: string,
  participantBId: string,
): Promise<void> {
  const { error } = await client.rpc("add_secret_santa_exclusion", {
    p_event_id: eventId,
    p_participant_a: participantAId,
    p_participant_b: participantBId,
  });

  if (error) throw toSecretSantaError(error);
}

export async function removeSecretSantaExclusion(
  client: Client,
  exclusionId: string,
): Promise<void> {
  const { error } = await client.rpc("remove_secret_santa_exclusion", {
    p_exclusion_id: exclusionId,
  });

  if (error) throw toSecretSantaError(error);
}

export interface SecretSantaExclusion {
  id: string;
  participantAId: string;
  participantBId: string;
}

export async function listSecretSantaExclusions(
  client: Client,
  eventId: string,
): Promise<SecretSantaExclusion[]> {
  const { data, error } = await client
    .from("secret_santa_exclusions")
    .select("id, participant_a_id, participant_b_id")
    .eq("event_id", eventId);

  if (error) throw new DbError(error.message, "desconhecido");

  return (data ?? []).map((row) => ({
    id: row.id,
    participantAId: row.participant_a_id,
    participantBId: row.participant_b_id,
  }));
}

export async function runSecretSantaDraw(client: Client, eventId: string): Promise<void> {
  const { error } = await client.rpc("run_secret_santa_draw", { p_event_id: eventId });

  if (error) throw toSecretSantaError(error);
}

export async function redoSecretSantaDraw(client: Client, eventId: string): Promise<void> {
  const { error } = await client.rpc("redo_secret_santa_draw", { p_event_id: eventId });

  if (error) throw toSecretSantaError(error);
}
