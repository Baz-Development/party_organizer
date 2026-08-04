import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { DbError } from "@/lib/db/errors";
import { resolveGuestEmailContext } from "./context";
import { processEmailQueue } from "./processQueue";
import type { EmailTemplateName } from "./templates";

type AdminClient = SupabaseClient<Database>;

export interface EnqueueEmailInput {
  eventId: string;
  recipientEmail: string;
  template: EmailTemplateName;
  /** Só campos seguros para log/depuração — nunca token nem URL com segredo
   * (design.md, decisão "Modelos como funções puras"). */
  data: Record<string, unknown>;
}

/**
 * Enfileira uma mensagem transacional. Recebe o client `service_role`: só
 * `service_role` tem `insert` em `email_messages`
 * (`20260803180400_rls_email.sql`) — nenhuma rota, autenticada ou anônima,
 * insere direto.
 *
 * Não valida nem resolve o segredo (token/link) — isso acontece dentro de
 * `processQueue.ts`, na hora de renderizar, para nunca persistir o segredo
 * nesta tabela.
 */
export async function enqueueEmail(admin: AdminClient, input: EnqueueEmailInput): Promise<void> {
  const { error } = await admin.from("email_messages").insert({
    event_id: input.eventId,
    recipient_email: input.recipientEmail.trim().toLowerCase(),
    template: input.template,
    data: input.data as Database["public"]["Tables"]["email_messages"]["Insert"]["data"],
  });

  if (error) throw new DbError(error.message, "desconhecido");
}

/**
 * Enfileira a confirmação de RSVP e tenta processar a fila best-effort, sem
 * bloquear a resposta já enviada ao convidado. Chamada de dentro de
 * `after()` pelas duas rotas de RSVP (`/api/rsvp/[token]`,
 * `/api/eventos/[slug]/rsvp-aberto`). Convidado sem e-mail: não enfileira.
 */
export async function enqueueRsvpConfirmationEmail(
  admin: AdminClient,
  guestId: string,
  status: "confirmado" | "recusado",
  input: { companions: number; kids: number },
): Promise<void> {
  const context = await resolveGuestEmailContext(admin, guestId);
  if (!context) return;

  await enqueueEmail(admin, {
    eventId: context.eventId,
    recipientEmail: context.email,
    template: "confirmacao_rsvp",
    data: {
      eventTitle: context.eventTitle,
      eventSlug: context.eventSlug,
      guestName: context.name,
      status,
      companions: input.companions,
      kids: input.kids,
    },
  });

  await processEmailQueue(admin);
}
