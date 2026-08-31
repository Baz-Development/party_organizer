import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";
import type { MuralMessage, Photo } from "@/lib/types";
import { DbError, DOMAIN_EXCEPTION } from "./errors";
import { toMuralMessage, toPhoto, type MuralMessageRow, type PhotoRow } from "./mappers";

type Client = SupabaseClient<Database>;

/**
 * Acesso a galeria, mural e capa do evento.
 *
 * O envio (foto/recado) do convidado sem conta passa pelas funções
 * `security definer` do banco (`submit_photo`, `submit_mural_message`,
 * `react_to_item`) via `client.rpc`, chamadas com o client do próprio
 * chamador — funciona com `anon` porque a função roda com privilégio
 * elevado. Leitura e moderação usam consulta direta, escopadas pela RLS.
 */

const READ_URL_TTL_SECONDS = 3600;

const MEDIA_ERROR_MESSAGES: Record<string, string> = {
  evento_invalido: "Evento não encontrado ou não publicado.",
  modulo_desabilitado: "Este módulo não está habilitado para o evento.",
  limite_envios: "Você atingiu o limite de envios neste intervalo. Tente novamente mais tarde.",
  convite_invalido: "Este link de convite não é válido.",
  autor_ausente: "Informe seu nome.",
  caminho_invalido: "Arquivo inválido.",
  mensagem_vazia: "Escreva uma mensagem.",
  mensagem_excede_limite: "O recado excede o limite de caracteres.",
  item_nao_visivel: "Este item não está disponível.",
};

export class MediaError extends DbError {
  constructor(readonly code: string) {
    super(MEDIA_ERROR_MESSAGES[code] ?? "Não foi possível concluir a operação.", "invalido");
    this.name = "MediaError";
  }
}

function toMediaError(error: { code?: string; message: string }): DbError {
  if (error.code === DOMAIN_EXCEPTION && error.message in MEDIA_ERROR_MESSAGES) {
    return new MediaError(error.message);
  }
  return new DbError(error.message, "desconhecido");
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function extensionFor(contentType: string): string {
  return EXTENSION_BY_MIME[contentType] ?? "bin";
}

// --- Galeria -----------------------------------------------------------

export interface RequestPhotoUploadResult {
  path: string;
  token: string;
  signedUrl: string;
}

/**
 * Emite a URL de upload assinada da foto. A checagem de "pode enviar"
 * (evento publicado, módulo habilitado, limite de envios) roda dentro de
 * `assert_can_submit_photo`, com o client de quem chamou — funciona sem
 * sessão porque a função é `security definer`. A emissão em si usa a chave
 * `service-role`: `guest-uploads` não tem política de `insert` para
 * `anon`/`authenticated` de propósito (ver design.md), então só o servidor
 * consegue criar a URL.
 */
export async function requestPhotoUpload(
  client: Client,
  eventSlug: string,
  visitorId: string,
  contentType: string,
): Promise<RequestPhotoUploadResult> {
  const { data: eventId, error } = await client.rpc("assert_can_submit_photo", {
    p_event_slug: eventSlug,
    p_visitor_id: visitorId,
  });
  if (error) throw toMediaError(error);

  const path = `${eventId}/${randomUUID()}.${extensionFor(contentType)}`;

  const admin = createSupabaseAdminClient();
  const { data, error: signError } = await admin.storage
    .from("guest-uploads")
    .createSignedUploadUrl(path);

  if (signError || !data) {
    throw new DbError(signError?.message ?? "Falha ao preparar o envio.", "desconhecido");
  }

  return { path, token: data.token, signedUrl: data.signedUrl };
}

export interface ConfirmPhotoUploadInput {
  storagePath: string;
  author?: string;
  caption?: string;
  visitorId: string;
  guestToken?: string;
}

export async function confirmPhotoUpload(
  client: Client,
  eventSlug: string,
  input: ConfirmPhotoUploadInput,
): Promise<Photo> {
  const { data, error } = await client
    .rpc("submit_photo", {
      p_event_slug: eventSlug,
      p_storage_path: input.storagePath,
      p_author: input.author ?? "",
      p_caption: input.caption ?? "",
      p_visitor_id: input.visitorId,
      p_guest_token: input.guestToken,
    })
    .single();

  if (error) throw toMediaError(error);

  // O autor pode não ter permissão de leitura ainda (aprovação prévia) — sem
  // URL de exibição neste retorno; a listagem resolve quando o item for
  // visível a quem pede.
  return toPhoto(data as PhotoRow, "");
}

export interface ListPhotosOptions {
  cursor?: string;
  limit?: number;
  status?: "pendente" | "aprovada" | "oculta";
}

export interface PhotoPage {
  items: Photo[];
  nextCursor: string | null;
}

export async function listPhotos(
  client: Client,
  eventId: string,
  options: ListPhotosOptions = {},
): Promise<PhotoPage> {
  const limit = options.limit ?? 20;

  let query = client
    .from("photos")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (options.status) query = query.eq("status", options.status);
  if (options.cursor) query = query.lt("created_at", options.cursor);

  const { data, error } = await query;
  if (error) throw new DbError(error.message, "desconhecido");

  const rows = data as PhotoRow[];
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? page[page.length - 1].created_at : null;

  const items = await Promise.all(
    page.map(async (row) => {
      const { data: signed } = await client.storage
        .from("guest-uploads")
        .createSignedUrl(row.storage_path, READ_URL_TTL_SECONDS);
      return toPhoto(row, signed?.signedUrl ?? "");
    }),
  );

  return { items, nextCursor };
}

export async function moderatePhoto(
  client: Client,
  photoId: string,
  status: "aprovada" | "oculta",
): Promise<Photo> {
  const { data, error } = await client
    .from("photos")
    .update({ status })
    .eq("id", photoId)
    .select("*")
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) throw new DbError("Foto não encontrada.", "nao-encontrado");

  return toPhoto(data as PhotoRow, "");
}

export async function deletePhoto(client: Client, photoId: string): Promise<void> {
  const { data: existing, error: selectError } = await client
    .from("photos")
    .select("storage_path")
    .eq("id", photoId)
    .maybeSingle();

  if (selectError) throw new DbError(selectError.message, "desconhecido");
  if (!existing) throw new DbError("Foto não encontrada.", "nao-encontrado");

  const { error, count } = await client.from("photos").delete({ count: "exact" }).eq("id", photoId);
  if (error) throw new DbError(error.message, "desconhecido");
  if (!count) throw new DbError("Foto não encontrada.", "nao-encontrado");

  // Melhor esforço: o arquivo órfão (se a remoção falhar) é varrido pela
  // rotina de limpeza — o registro já não existe mais, que é a garantia
  // observável pelo resto do sistema.
  await client.storage.from("guest-uploads").remove([existing.storage_path]);
}

// --- Mural ---------------------------------------------------------------

export interface SubmitMuralMessageInput {
  author?: string;
  message: string;
  visitorId: string;
  guestToken?: string;
  /** Path já enviado ao Storage (`guest-uploads`), prefixado por `{event_id}/`. */
  photoPath?: string;
}

/**
 * Emite a URL de upload assinada da foto de um recado. Mesmo padrão de
 * `requestPhotoUpload` — a checagem de "pode enviar" roda em
 * `assert_can_submit_mural_photo` (módulo `mural` habilitado, limite de
 * envios), e a emissão em si usa a chave `service-role`.
 */
export async function requestMuralPhotoUpload(
  client: Client,
  eventSlug: string,
  visitorId: string,
  contentType: string,
): Promise<RequestPhotoUploadResult> {
  const { data: eventId, error } = await client.rpc("assert_can_submit_mural_photo", {
    p_event_slug: eventSlug,
    p_visitor_id: visitorId,
  });
  if (error) throw toMediaError(error);

  const path = `${eventId}/${randomUUID()}.${extensionFor(contentType)}`;

  const admin = createSupabaseAdminClient();
  const { data, error: signError } = await admin.storage
    .from("guest-uploads")
    .createSignedUploadUrl(path);

  if (signError || !data) {
    throw new DbError(signError?.message ?? "Falha ao preparar o envio.", "desconhecido");
  }

  return { path, token: data.token, signedUrl: data.signedUrl };
}

export async function submitMuralMessage(
  client: Client,
  eventSlug: string,
  input: SubmitMuralMessageInput,
): Promise<MuralMessage> {
  const { data, error } = await client
    .rpc("submit_mural_message", {
      p_event_slug: eventSlug,
      p_author: input.author ?? "",
      p_message: input.message,
      p_visitor_id: input.visitorId,
      p_guest_token: input.guestToken,
      p_photo_path: input.photoPath,
    })
    .single();

  if (error) throw toMediaError(error);

  // O recado nasce sempre visível; a URL da foto (quando há) é resolvida aqui.
  const row = data as MuralMessageRow;
  let photoUrl: string | undefined;
  if (row.photo_path) {
    const { data: signed } = await client.storage
      .from("guest-uploads")
      .createSignedUrl(row.photo_path, READ_URL_TTL_SECONDS);
    photoUrl = signed?.signedUrl;
  }
  return toMuralMessage(row, photoUrl);
}

export interface ListMuralOptions {
  cursor?: string;
  limit?: number;
  status?: "pendente" | "aprovada" | "oculta";
}

export interface MuralPage {
  items: MuralMessage[];
  nextCursor: string | null;
}

export async function listMuralMessages(
  client: Client,
  eventId: string,
  options: ListMuralOptions = {},
): Promise<MuralPage> {
  const limit = options.limit ?? 20;

  let query = client
    .from("mural_messages")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (options.status) query = query.eq("status", options.status);
  if (options.cursor) query = query.lt("created_at", options.cursor);

  const { data, error } = await query;
  if (error) throw new DbError(error.message, "desconhecido");

  const rows = data as MuralMessageRow[];
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? page[page.length - 1].created_at : null;

  const items = await Promise.all(
    page.map(async (row) => {
      if (!row.photo_path) return toMuralMessage(row);
      const { data: signed } = await client.storage
        .from("guest-uploads")
        .createSignedUrl(row.photo_path, READ_URL_TTL_SECONDS);
      return toMuralMessage(row, signed?.signedUrl ?? "");
    }),
  );

  return { items, nextCursor };
}

export async function moderateMuralMessage(
  client: Client,
  messageId: string,
  status: "aprovada" | "oculta",
): Promise<MuralMessage> {
  const { data, error } = await client
    .from("mural_messages")
    .update({ status })
    .eq("id", messageId)
    .select("*")
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) throw new DbError("Recado não encontrado.", "nao-encontrado");

  return toMuralMessage(data as MuralMessageRow);
}

export async function deleteMuralMessage(client: Client, messageId: string): Promise<void> {
  const { data: existing, error: selectError } = await client
    .from("mural_messages")
    .select("photo_path")
    .eq("id", messageId)
    .maybeSingle();

  if (selectError) throw new DbError(selectError.message, "desconhecido");
  if (!existing) throw new DbError("Recado não encontrado.", "nao-encontrado");

  const { error, count } = await client
    .from("mural_messages")
    .delete({ count: "exact" })
    .eq("id", messageId);

  if (error) throw new DbError(error.message, "desconhecido");
  if (!count) throw new DbError("Recado não encontrado.", "nao-encontrado");

  // Melhor esforço, como em `deletePhoto`: o registro já não existe.
  if (existing.photo_path) {
    await client.storage.from("guest-uploads").remove([existing.photo_path]);
  }
}

// --- Curtidas --------------------------------------------------------------

export async function reactToItem(
  client: Client,
  targetType: "foto" | "recado",
  targetId: string,
  visitorId: string,
): Promise<number> {
  const { data, error } = await client
    .rpc("react_to_item", {
      p_target_type: targetType,
      p_target_id: targetId,
      p_visitor_id: visitorId,
    })
    .single();

  if (error) throw toMediaError(error);

  return data as number;
}

// --- Capa do evento --------------------------------------------------------

export interface RequestCoverUploadResult {
  path: string;
  token: string;
  signedUrl: string;
}

export async function requestCoverUpload(
  client: Client,
  eventId: string,
  contentType: string,
): Promise<RequestCoverUploadResult> {
  const { data: canManage, error } = await client.rpc("can_manage_event", { event: eventId });
  if (error) throw new DbError(error.message, "desconhecido");
  if (!canManage) throw new DbError("Você não administra este evento.", "nao-encontrado");

  const path = `${eventId}/${randomUUID()}.${extensionFor(contentType)}`;

  const admin = createSupabaseAdminClient();
  const { data, error: signError } = await admin.storage
    .from("event-media")
    .createSignedUploadUrl(path);

  if (signError || !data) {
    throw new DbError(signError?.message ?? "Falha ao preparar o envio.", "desconhecido");
  }

  return { path, token: data.token, signedUrl: data.signedUrl };
}

/** URL assinada de leitura da capa, ou `undefined` quando o evento não tem uma. */
export async function resolveCoverUrl(
  client: Client,
  coverPath: string | null | undefined,
): Promise<string | undefined> {
  if (!coverPath) return undefined;

  const { data } = await client.storage
    .from("event-media")
    .createSignedUrl(coverPath, READ_URL_TTL_SECONDS);

  return data?.signedUrl;
}
