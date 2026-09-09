import "server-only";

import { z } from "zod";
import { formatEnvIssues } from "@/lib/env.public";

/**
 * Variáveis de ambiente do módulo de e-mail, isoladas de `src/lib/env.ts`.
 *
 * Mesmo raciocínio de `src/lib/payments/env.ts`: acoplar credenciais de
 * e-mail em `src/lib/env.ts` faria qualquer rota não relacionada a
 * notificação falhar ao subir sem elas. Este módulo só é importado por
 * `src/lib/email/*.ts` e pela rota interna de processamento da fila.
 */
const schema = z.object({
  EMAIL_FROM_ADDRESS: z.email("precisa ser um e-mail válido"),
  EMAIL_FROM_DOMAIN: z.string().min(1, "não pode ser vazia"),
  EMAIL_QUEUE_CRON_SECRET: z.string().min(1, "não pode ser vazia"),
  // Reservada para quando um provedor real substituir `mockEmailProvider.ts`
  // — não lida pelo mock, mesmo padrão de `PAYMENT_PROVIDER_SECRET_KEY`.
  EMAIL_PROVIDER_API_KEY: z.string().min(1, "não pode ser vazia"),
  // Opcional — endereço de `reply-to` do Resend, igual `EMAIL_REPLY_TO` da
  // `camu-web-landing-page`. Sem valor, o e-mail sai sem `reply-to`.
  EMAIL_REPLY_TO: z.email("precisa ser um e-mail válido").optional(),
  // Sem valor: mensagens fora de produção são descartadas em vez de
  // enviadas (design.md, decisão "mockEmailProvider e redirecionamento por
  // ambiente").
  EMAIL_TEST_REDIRECT_ADDRESS: z.email("precisa ser um e-mail válido").optional(),
  // Servidor SMTP de desenvolvimento (Mailpit local). Quando `EMAIL_SMTP_HOST`
  // está definido, o provedor de e-mail deixa de ser o mock e passa a entregar
  // por SMTP — o que torna o e-mail inspecionável no Mailpit.
  EMAIL_SMTP_HOST: z.string().min(1).optional(),
  EMAIL_SMTP_PORT: z.coerce.number().int().positive().optional(),
});

export const emailEnv = parseEmailEnv();

function parseEmailEnv(): z.infer<typeof schema> {
  const result = schema.safeParse({
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
    EMAIL_FROM_DOMAIN: process.env.EMAIL_FROM_DOMAIN,
    EMAIL_QUEUE_CRON_SECRET: process.env.EMAIL_QUEUE_CRON_SECRET,
    EMAIL_PROVIDER_API_KEY: process.env.EMAIL_PROVIDER_API_KEY,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO || undefined,
    EMAIL_TEST_REDIRECT_ADDRESS: process.env.EMAIL_TEST_REDIRECT_ADDRESS || undefined,
    EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST || undefined,
    EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT || undefined,
  });

  if (!result.success) {
    throw new Error(formatEnvIssues("de e-mail", result.error.issues));
  }
  return result.data;
}
