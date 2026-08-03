import { z } from "zod";

/**
 * Validação de entrada das rotas que escrevem convidado.
 */

const optionalText = z.string().trim().max(200).optional();

export const createGuestSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do convidado.").max(120),
  group: optionalText,
  email: z.email("E-mail inválido.").max(200).optional().or(z.literal("")),
  phone: optionalText,
});

export const updateGuestSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do convidado.").max(120).optional(),
  group: optionalText,
  email: z.email("E-mail inválido.").max(200).optional().or(z.literal("")),
  phone: optionalText,
});

export const RSVP_STATUSES = ["pendente", "confirmado", "recusado"] as const;

export const guestStatusFilterSchema = z.enum(RSVP_STATUSES, {
  message: "Estado de resposta desconhecido.",
});

export const importGuestRowSchema = z.object({
  name: z.string().trim().max(120).optional(),
  group: optionalText,
  email: optionalText,
  phone: optionalText,
});

export const importGuestsSchema = z.object({
  rows: z.array(importGuestRowSchema).min(1, "Envie ao menos uma linha."),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type ImportGuestsInput = z.infer<typeof importGuestsSchema>;
