import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isProduction } from "@/lib/env";
import { publicEnv } from "@/lib/env.public";
import type { Database } from "@/lib/database.types";
import { emailProvider as defaultEmailProvider, type EmailProvider } from "./index";
import { emailEnv } from "./env";
import { MAX_ATTEMPTS, backoffMinutes, isEssentialTemplate, isSuppressed } from "./policy";
import { emailTemplates } from "./templates";

type AdminClient = SupabaseClient<Database>;
type EmailMessageRow = Database["public"]["Tables"]["email_messages"]["Row"];

/** Modelos cujo link é o RSVP do próprio convidado. */
const RSVP_LINK_TEMPLATES = new Set<Database["public"]["Enums"]["email_template"]>(["convite", "lembrete_rsvp"]);

export interface ProcessQueueResult {
  claimed: number;
  delivered: number;
  failed: number;
  discarded: number;
}

export interface ProcessQueueOptions {
  /** Injeção de dependência para teste — falha temporária/permanente
   * simulada sem precisar de rede real. Produção usa `emailProvider`
   * (`src/lib/email/index.ts`, hoje `mockEmailProvider`). */
  provider?: EmailProvider;
  limit?: number;
}

/**
 * Reivindica um lote de `email_messages` pendentes e tenta entregar cada
 * uma. Chamada tanto pela rota interna do cron quanto pelo `after()`
 * best-effort logo após enfileirar (design.md, decisão "Fila em tabela
 * própria...").
 */
export async function processEmailQueue(
  admin: AdminClient,
  options: ProcessQueueOptions = {},
): Promise<ProcessQueueResult> {
  const provider = options.provider ?? defaultEmailProvider;
  const limit = options.limit ?? 20;

  const { data: claimed, error: claimError } = await admin.rpc("claim_pending_email_messages", {
    p_limit: limit,
  });

  if (claimError) throw new Error(claimError.message);

  const messages = claimed ?? [];
  const result: ProcessQueueResult = { claimed: messages.length, delivered: 0, failed: 0, discarded: 0 };

  for (const message of messages) {
    const outcome = await processOne(admin, message, provider);
    result[outcome]++;
  }

  return result;
}

async function processOne(
  admin: AdminClient,
  message: EmailMessageRow,
  provider: EmailProvider,
): Promise<"delivered" | "failed" | "discarded"> {
  const suppression = await findSuppression(admin, message.event_id, message.recipient_email);

  if (isSuppressed(suppression, message.template)) {
    await admin
      .from("email_messages")
      .update({ status: "falha", last_error: `suprimido_${suppression}` })
      .eq("id", message.id);
    return "failed";
  }

  const data = (message.data ?? {}) as Record<string, unknown>;
  const eventSlug = typeof data.eventSlug === "string" ? data.eventSlug : undefined;
  const eventPath = eventSlug ? `/${message.event_id}/${eventSlug}` : undefined;
  const unsubscribeLink =
    eventPath && !isEssentialTemplate(message.template)
      ? `${publicEnv.NEXT_PUBLIC_SITE_URL}${eventPath}/descadastro?email=${encodeURIComponent(message.recipient_email)}`
      : "";

  let link = "";
  let renderData: Record<string, unknown> = data;
  if (message.template === "acesso_painel") {
    link = `${publicEnv.NEXT_PUBLIC_SITE_URL}/painel`;
    renderData = {
      ...data,
      pageUrl: eventPath ? `${publicEnv.NEXT_PUBLIC_SITE_URL}${eventPath}` : undefined,
      loginUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/entrar`,
    };
  } else if (RSVP_LINK_TEMPLATES.has(message.template) || message.template === "revelacao_amigo_secreto") {
    const guestId = typeof data.guestId === "string" ? data.guestId : undefined;
    const token = guestId ? await resolveInviteToken(admin, guestId) : null;

    if (!token) {
      // Convidado ou convite removido depois do enfileiramento: nada a
      // reintentar, a mensagem nunca vai ter link válido.
      await admin
        .from("email_messages")
        .update({ status: "falha", last_error: "convite_nao_encontrado" })
        .eq("id", message.id);
      return "failed";
    }

    link =
      message.template === "revelacao_amigo_secreto"
        ? `${publicEnv.NEXT_PUBLIC_SITE_URL}${eventPath}/amigo-secreto/revelacao?convite=${token}`
        : `${publicEnv.NEXT_PUBLIC_SITE_URL}${eventPath}/rsvp?convite=${token}`;
  }

  const render = emailTemplates[message.template](renderData, link, unsubscribeLink);

  const recipient = resolveRecipient(message.recipient_email);
  if (!recipient) {
    // Fora de produção, sem destino de teste configurado: descarta sem
    // chamar o provedor (design.md, decisão "mockEmailProvider e
    // redirecionamento por ambiente"). Conta como processada, não como erro.
    await admin
      .from("email_messages")
      .update({ status: "entregue", last_error: "descartado_fora_de_producao" })
      .eq("id", message.id);
    return "discarded";
  }

  let sendResult: Awaited<ReturnType<EmailProvider["send"]>>;
  try {
    sendResult = await provider.send({ to: recipient, subject: render.subject, html: render.html, text: render.text });
  } catch (err) {
    await recordTemporaryFailure(admin, message, err instanceof Error ? err.message : "erro_desconhecido");
    return "failed";
  }

  if ("permanentFailure" in sendResult) {
    await admin
      .from("email_suppressions")
      .upsert(
        { event_id: message.event_id, email: message.recipient_email, reason: "retorno_permanente" },
        { onConflict: "event_id,email", ignoreDuplicates: true },
      );
    await admin
      .from("email_messages")
      .update({ status: "falha", last_error: sendResult.reason })
      .eq("id", message.id);
    return "failed";
  }

  await admin
    .from("email_messages")
    .update({ status: "entregue", provider_message_id: sendResult.providerMessageId, last_error: null })
    .eq("id", message.id);
  return "delivered";
}

async function recordTemporaryFailure(admin: AdminClient, message: EmailMessageRow, reason: string): Promise<void> {
  const attempts = message.attempts + 1;

  if (attempts >= MAX_ATTEMPTS) {
    await admin
      .from("email_messages")
      .update({ status: "falha", attempts, last_error: reason })
      .eq("id", message.id);
    return;
  }

  const nextAttemptAt = new Date(Date.now() + backoffMinutes(attempts) * 60_000).toISOString();
  await admin
    .from("email_messages")
    .update({ status: "pendente", attempts, next_attempt_at: nextAttemptAt, last_error: reason })
    .eq("id", message.id);
}

async function findSuppression(
  admin: AdminClient,
  eventId: string,
  email: string,
): Promise<Database["public"]["Enums"]["email_suppression_reason"] | null> {
  const { data } = await admin
    .from("email_suppressions")
    .select("reason")
    .eq("event_id", eventId)
    .eq("email", email)
    .maybeSingle();

  return data?.reason ?? null;
}

async function resolveInviteToken(admin: AdminClient, guestId: string): Promise<string | null> {
  const { data } = await admin.from("guest_invites").select("token").eq("guest_id", guestId).maybeSingle();
  return data?.token ?? null;
}

/** Fora de produção nunca devolve o endereço real (design.md, decisão
 * "mockEmailProvider e redirecionamento por ambiente"). */
function resolveRecipient(recipientEmail: string): string | null {
  if (isProduction) return recipientEmail;
  return emailEnv.EMAIL_TEST_REDIRECT_ADDRESS ?? null;
}
