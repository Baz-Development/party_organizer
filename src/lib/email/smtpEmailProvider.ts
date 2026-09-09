import "server-only";

import { emailEnv } from "./env";
import type { EmailProvider } from "./provider";

/**
 * Provedor de e-mail por SMTP, para desenvolvimento com o Mailpit local.
 *
 * `nodemailer` é `devDependency` e entra por `import()` dinâmico, atrás da
 * checagem de `EMAIL_SMTP_HOST` em `src/lib/email/index.ts` — nunca é
 * empacotado nem carregado quando o provedor ativo é o mock (produção).
 *
 * Falha de conexão sobe como exceção (não `permanentFailure`): a fila trata
 * como falha temporária e reagenda, que é o certo para um SMTP local que pode
 * estar de pé só às vezes.
 */
export const smtpEmailProvider: EmailProvider = {
  async send(input) {
    const { createTransport } = await import("nodemailer");

    const transport = createTransport({
      host: emailEnv.EMAIL_SMTP_HOST,
      port: emailEnv.EMAIL_SMTP_PORT ?? 1025,
      secure: false,
      tls: { rejectUnauthorized: false },
    });

    const info = await transport.sendMail({
      from: emailEnv.EMAIL_FROM_ADDRESS,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return { providerMessageId: info.messageId };
  },
};
