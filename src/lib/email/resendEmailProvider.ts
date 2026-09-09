import "server-only";

import { emailEnv } from "./env";
import type { EmailProvider } from "./provider";

/**
 * Provedor de e-mail transacional via Resend (https://resend.com).
 *
 * Fala direto com a API REST (`POST https://api.resend.com/emails`) por
 * `fetch` — sem SDK, mesmo motivo de `smtpEmailProvider` só puxar
 * `nodemailer` sob demanda: nada de dependência nova no bundle de produção
 * para uma única chamada HTTP.
 *
 * Classificação de erro seguindo o contrato de `EmailProvider`:
 * - 4xx de validação (endereço inválido, remetente fora do domínio
 *   verificado, campo obrigatório ausente) → `permanentFailure`: a fila não
 *   reintenta e suprime o endereço.
 * - 429 e 5xx, além de erro de rede → exceção: `processQueue` trata como
 *   falha temporária e reagenda com backoff.
 *
 * Ativado por `src/lib/email/index.ts` quando `EMAIL_PROVIDER_API_KEY`
 * começa com `re_` (formato de chave do Resend).
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** `name` de erro do Resend que representa condição transitória. */
const TEMPORARY_ERROR_NAMES = new Set(["rate_limit_exceeded", "application_error", "internal_server_error"]);

interface ResendError {
  name?: string;
  message?: string;
}

export const resendEmailProvider: EmailProvider = {
  async send(input) {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${emailEnv.EMAIL_PROVIDER_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: emailEnv.EMAIL_FROM_ADDRESS,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (response.ok) {
      const data = (await response.json().catch(() => ({}))) as { id?: string };
      return { providerMessageId: data.id ?? "resend_sem_id" };
    }

    const error = (await response.json().catch(() => ({}))) as ResendError;
    const reason = `${error.name ?? `http_${response.status}`}: ${error.message ?? "erro sem detalhe"}`;

    const temporary =
      response.status === 429 ||
      response.status >= 500 ||
      (error.name !== undefined && TEMPORARY_ERROR_NAMES.has(error.name));

    if (temporary) {
      throw new Error(`resend_temporario: ${reason}`);
    }

    return { permanentFailure: true, reason };
  },
};
