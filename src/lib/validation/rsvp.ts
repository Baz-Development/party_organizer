import { z } from "zod";
import { RSVP_STATUSES } from "./guest";

/**
 * Validação de entrada do fluxo de RSVP, tanto o identificado por token
 * quanto o de lista aberta.
 */

export const submitRsvpSchema = z.object({
  status: z.enum(RSVP_STATUSES.filter((s) => s !== "pendente") as ["confirmado", "recusado"], {
    message: "Informe se o convidado confirma ou recusa.",
  }),
  companions: z.number().int().min(0, "Número de acompanhantes inválido.").default(0),
  kids: z.number().int().min(0, "Número de crianças inválido.").default(0),
  dietary: z.string().trim().max(500).optional(),
});

export const submitOpenRsvpSchema = submitRsvpSchema.extend({
  name: z.string().trim().min(1, "Informe o nome do convidado.").max(120),
});

export type SubmitRsvpInput = z.infer<typeof submitRsvpSchema>;
export type SubmitOpenRsvpInput = z.infer<typeof submitOpenRsvpSchema>;
