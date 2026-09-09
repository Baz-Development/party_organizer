import { z } from "zod";

/**
 * Validação do cadastro de conta de cliente pelo admin.
 *
 * Roda antes de chamar o GoTrue para que "faltou o nome" vire um 400 que diz
 * qual campo, em vez de um erro genérico de convite.
 */
export const inviteClientSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail do cliente.")
    .email("E-mail inválido.")
    .transform((value) => value.toLowerCase()),
  displayName: z
    .string()
    .trim()
    .min(1, "Informe o nome do cliente.")
    .max(120),
});

export type InviteClientInput = z.infer<typeof inviteClientSchema>;

/**
 * Corpo do reenvio do e-mail de acesso ao painel (`POST
 * /api/admin/clientes/[id]/acesso`). Tudo opcional: sem `eventId` o endpoint
 * usa o evento mais recente do cliente.
 */
export const sendClientAccessSchema = z.object({
  eventId: z.string().uuid("Evento inválido.").optional(),
});

export type SendClientAccessInput = z.infer<typeof sendClientAccessSchema>;
