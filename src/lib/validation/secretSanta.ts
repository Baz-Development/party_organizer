import { z } from "zod";

/**
 * Validação de entrada das rotas do amigo secreto. `wishlistSchema` usa o
 * mesmo limite de 5 itens da tela de cadastro
 * (`src/app/e/[slug]/amigo-secreto/SecretSantaSignup.tsx`).
 */

export const joinSecretSantaSchema = z.object({
  displayName: z.string().trim().min(1, "Informe seu nome.").max(120),
});

export const wishlistSchema = z.object({
  wishlist: z.array(z.string().trim().min(1).max(200)).max(5, "No máximo 5 itens na lista."),
});

export const addSecretSantaExclusionSchema = z
  .object({
    participantAId: z.uuid("Participante inválido."),
    participantBId: z.uuid("Participante inválido."),
  })
  .refine((data) => data.participantAId !== data.participantBId, {
    message: "Selecione dois participantes diferentes.",
    path: ["participantBId"],
  });

export type JoinSecretSantaInput = z.infer<typeof joinSecretSantaSchema>;
export type WishlistInput = z.infer<typeof wishlistSchema>;
export type AddSecretSantaExclusionInput = z.infer<typeof addSecretSantaExclusionSchema>;
