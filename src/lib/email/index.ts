import "server-only";

import { emailEnv } from "./env";
import { mockEmailProvider } from "./mockEmailProvider";
import { resendEmailProvider } from "./resendEmailProvider";
import { smtpEmailProvider } from "./smtpEmailProvider";
import type { EmailProvider } from "./provider";

/**
 * Ponto único de instanciação do provedor de e-mail ativo.
 *
 * - `EMAIL_SMTP_HOST` definido (desenvolvimento com Mailpit): entrega por
 *   SMTP para o e-mail ficar inspecionável.
 * - senão, `EMAIL_PROVIDER_API_KEY` no formato de chave do Resend (`re_...`):
 *   entrega real via Resend (`docs/email-resend.md`).
 * - senão, `mockEmailProvider` (nada sai da máquina — testes e ambientes sem
 *   credencial).
 *
 * Espelha `src/lib/payments/index.ts`.
 */
export const emailProvider: EmailProvider = emailEnv.EMAIL_SMTP_HOST
  ? smtpEmailProvider
  : emailEnv.EMAIL_PROVIDER_API_KEY.startsWith("re_")
    ? resendEmailProvider
    : mockEmailProvider;

export type { EmailProvider } from "./provider";
