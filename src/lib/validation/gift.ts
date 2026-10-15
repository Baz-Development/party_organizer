import { z } from "zod";

/**
 * Validação de entrada das rotas de presentes e checkout.
 *
 * Preço e valor de contribuição chegam do formulário em reais (o jeito que
 * humano digita) e são convertidos para centavos aqui — é a única fronteira
 * onde `number` de reais vira `integer` de centavos antes de tocar o banco.
 */

const optionalText = z.string().trim().max(500).optional();

const reaisToCents = (value: number) => Math.round(value * 100);

export const createGiftSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do presente.").max(160),
  category: z.string().trim().min(1, "Informe a categoria.").max(80),
  price: z.number().positive("O preço precisa ser maior que zero.").transform(reaisToCents),
  store: optionalText,
  note: optionalText,
  quotaTarget: z
    .number()
    .positive("A meta da cota precisa ser maior que zero.")
    .transform(reaisToCents)
    .optional(),
  imagePath: z.string().trim().min(1).max(300).optional(),
});

export const updateGiftSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do presente.").max(160).optional(),
  category: z.string().trim().min(1, "Informe a categoria.").max(80).optional(),
  price: z.number().positive("O preço precisa ser maior que zero.").transform(reaisToCents).optional(),
  store: optionalText,
  note: optionalText,
  imagePath: z.string().trim().min(1).max(300).nullable().optional(),
});

export const startGiftCheckoutSchema = z.object({
  buyerName: z.string().trim().min(1, "Informe seu nome.").max(120),
  buyerEmail: z.email("E-mail inválido.").max(200).optional().or(z.literal("")),
  // Só usado por presente de cota — para presente simples o servidor ignora
  // qualquer valor enviado e cobra o preço registrado no banco
  // ("Requirement: Checkout com valor determinado pelo servidor").
  amount: z.number().positive("Informe um valor de contribuição válido.").transform(reaisToCents).optional(),
});

export type CreateGiftInput = z.infer<typeof createGiftSchema>;
export type UpdateGiftInput = z.infer<typeof updateGiftSchema>;
export type StartGiftCheckoutInput = z.infer<typeof startGiftCheckoutSchema>;
