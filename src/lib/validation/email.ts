import { z } from "zod";

/**
 * Disparo em lote de convites: lista explícita de convidados, ou omitido
 * para "todos os pendentes" (quem ainda não respondeu o RSVP).
 */
export const sendGuestInvitesSchema = z.object({
  guestIds: z.array(z.string().uuid()).optional(),
});

export const unsubscribeSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});
