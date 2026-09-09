import "server-only";

import { Resend } from "resend";
import { emailEnv } from "./env";
import type { EmailProvider } from "./provider";

/**
 * Provedor de e-mail transacional via Resend (https://resend.com).
 *
 * Mesma implementação da `camu-web-landing-page`
 * (`src/lib/notify/email.ts`): SDK oficial `resend`, uma chamada
 * `resend.emails.send(...)`, e qualquer `error` do provedor vira exceção.
 *
 * `processQueue` trata a exceção como falha temporária e reagenda com
 * backoff até `MAX_ATTEMPTS` (`policy.ts`) — não há classificação
 * permanente/temporária aqui, igual à landing page.
 *
 * Ativado por `src/lib/email/index.ts` quando `EMAIL_PROVIDER_API_KEY`
 * começa com `re_` (formato de chave do Resend).
 */
const resend = new Resend(emailEnv.EMAIL_PROVIDER_API_KEY);

export const resendEmailProvider: EmailProvider = {
  async send(input) {
    const { data, error } = await resend.emails.send({
      from: emailEnv.EMAIL_FROM_ADDRESS,
      to: input.to,
      ...(emailEnv.EMAIL_REPLY_TO ? { replyTo: emailEnv.EMAIL_REPLY_TO } : {}),
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) throw new Error(error.message);

    return { providerMessageId: data?.id ?? "resend_sem_id" };
  },
};
