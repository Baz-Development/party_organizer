import "server-only";

import { z } from "zod";
import { formatEnvIssues } from "@/lib/env.public";

/**
 * Variáveis de ambiente do módulo de pagamentos, isoladas de `src/lib/env.ts`.
 *
 * `src/lib/env.ts` é importado por quase toda rota do projeto (via
 * `src/lib/supabase/admin.ts`); acoplar as credenciais de pagamento lá faria
 * qualquer rota não relacionada a presentes falhar ao subir sem elas. Este
 * módulo só é importado por `src/lib/payments/*.ts` e pelas rotas de
 * checkout/webhook — mesmo padrão de `formatEnvIssues`, parse eager no
 * import, mensagem nomeando a variável que falta
 * ("Requirement: Credenciais de pagamento por ambiente" — "Credencial ausente").
 */
const schema = z.object({
  PAYMENT_WEBHOOK_SECRET: z.string().min(1, "não pode ser vazia"),
  // Reservadas para quando um provedor real substituir `mockProvider.ts` —
  // não lidas pelo mock, mas já validadas para que a troca não exija tocar
  // em validação de env de novo (design.md, decisão 8).
  PAYMENT_PROVIDER_SECRET_KEY: z.string().min(1, "não pode ser vazia"),
  PAYMENT_PROVIDER_PUBLIC_KEY: z.string().min(1, "não pode ser vazia"),
});

export const paymentsEnv = parsePaymentsEnv();

function parsePaymentsEnv(): z.infer<typeof schema> {
  const result = schema.safeParse({
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
    PAYMENT_PROVIDER_SECRET_KEY: process.env.PAYMENT_PROVIDER_SECRET_KEY,
    PAYMENT_PROVIDER_PUBLIC_KEY: process.env.PAYMENT_PROVIDER_PUBLIC_KEY,
  });

  if (!result.success) {
    throw new Error(formatEnvIssues("de pagamento", result.error.issues));
  }
  return result.data;
}
