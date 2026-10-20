import { z } from "zod";

/** Validação de entrada das rotas de `/api/eventos/[slug]/sorteios`. */

const optionalText = z.string().trim().max(500).optional();

const alternatesCount = z
  .number()
  .int("Informe um número inteiro de suplentes.")
  .min(0, "O número de suplentes não pode ser negativo.")
  .max(50, "No máximo 50 suplentes.");

export const createRaffleSchema = z.object({
  title: z.string().trim().min(1, "Dê um nome ao sorteio.").max(120),
  description: optionalText,
  alternatesCount: alternatesCount.optional(),
});

export const RAFFLE_PARTICIPANT_MODES = ["selecionados", "todos", "confirmados"] as const;

export const updateRaffleSchema = z.object({
  title: z.string().trim().min(1, "Dê um nome ao sorteio.").max(120).optional(),
  description: optionalText,
  alternatesCount: alternatesCount.optional(),
  participantMode: z.enum(RAFFLE_PARTICIPANT_MODES, "Modo de participação inválido.").optional(),
});

const quantity = z
  .number()
  .int("Informe um número inteiro de vencedores.")
  .min(1, "Cada prêmio precisa de pelo menos 1 vencedor.")
  .max(100, "No máximo 100 vencedores por prêmio.");

export const createRafflePrizeSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do prêmio.").max(160),
  description: optionalText,
  quantity: quantity.optional(),
  imagePath: z.string().trim().min(1).max(300).optional(),
});

export const updateRafflePrizeSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do prêmio.").max(160).optional(),
  description: optionalText,
  quantity: quantity.optional(),
  /** `null` remove a foto. */
  imagePath: z.string().trim().min(1).max(300).nullable().optional(),
});

export const reorderRafflePrizesSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200),
});

export const setRaffleParticipantsSchema = z.object({
  guestIds: z.array(z.uuid()).max(2000),
});

export const RAFFLE_ACTIONS = ["iniciar", "reabrir", "recomecar", "encerrar"] as const;

export const raffleActionSchema = z.object({
  acao: z.enum(RAFFLE_ACTIONS, "Ação inválida."),
});

export const updateRaffleResultSchema = z.object({
  status: z.literal("ausente"),
});

export type CreateRaffleInput = z.infer<typeof createRaffleSchema>;
export type UpdateRaffleInput = z.infer<typeof updateRaffleSchema>;
export type CreateRafflePrizeInput = z.infer<typeof createRafflePrizeSchema>;
export type UpdateRafflePrizeInput = z.infer<typeof updateRafflePrizeSchema>;
export type RaffleAction = (typeof RAFFLE_ACTIONS)[number];
