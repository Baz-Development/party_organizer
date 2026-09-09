import "server-only";

import { emailEnv } from "./env";
import { mockEmailProvider } from "./mockEmailProvider";
import { smtpEmailProvider } from "./smtpEmailProvider";
import type { EmailProvider } from "./provider";

/**
 * Ponto único de instanciação do provedor de e-mail ativo.
 *
 * Com `EMAIL_SMTP_HOST` definido (desenvolvimento com Mailpit), entrega por
 * SMTP para o e-mail ficar inspecionável. Sem ele, o `mockEmailProvider`
 * (produção ainda não tem provedor real — design.md, Non-Goals). Trocar por um
 * provedor real de produção é alterar esta linha. Espelha
 * `src/lib/payments/index.ts`.
 */
export const emailProvider: EmailProvider = emailEnv.EMAIL_SMTP_HOST
  ? smtpEmailProvider
  : mockEmailProvider;

export type { EmailProvider } from "./provider";
