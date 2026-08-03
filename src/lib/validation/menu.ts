import { z } from "zod";

/**
 * Validação de entrada das rotas de enquete de cardápio.
 *
 * "Ao menos duas opções por enquete" é regra sobre o conjunto, não sobre uma
 * linha — por isso mora aqui (`options.min(2)`), não em constraint da tabela
 * `menu_options`.
 */

const closesAt = z
  .string()
  .min(1, "Informe o prazo de encerramento.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Prazo inválido.")
  .transform((value) => new Date(value).toISOString());

const optionTags = z.array(z.string().trim().min(1).max(40)).max(10).default([]);

const menuOptionSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da opção.").max(120),
  description: z.string().trim().max(500).optional(),
  tags: optionTags,
});

export const createMenuPollSchema = z.object({
  course: z.string().trim().min(1, "Informe a etapa da refeição.").max(60),
  question: z.string().trim().min(1, "Informe a pergunta da enquete.").max(200),
  closesAt,
  maxChoices: z.number().int().min(1, "O limite de escolhas deve ser ao menos um.").default(1),
  options: z.array(menuOptionSchema).min(2, "A enquete precisa de ao menos duas opções."),
});

export const updateMenuPollSchema = z.object({
  course: z.string().trim().min(1).max(60).optional(),
  question: z.string().trim().min(1).max(200).optional(),
  closesAt: closesAt.optional(),
  maxChoices: z.number().int().min(1, "O limite de escolhas deve ser ao menos um.").optional(),
});

export const createMenuOptionSchema = menuOptionSchema;

export const submitMenuVoteSchema = z.object({
  pollId: z.uuid("Enquete inválida."),
  optionIds: z
    .array(z.uuid("Opção inválida."))
    .min(1, "Escolha ao menos uma opção."),
});

export type CreateMenuPollInput = z.infer<typeof createMenuPollSchema>;
export type UpdateMenuPollInput = z.infer<typeof updateMenuPollSchema>;
export type CreateMenuOptionInput = z.infer<typeof createMenuOptionSchema>;
export type SubmitMenuVoteInput = z.infer<typeof submitMenuVoteSchema>;
