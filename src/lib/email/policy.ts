import type { Database } from "@/lib/database.types";

type EmailTemplate = Database["public"]["Enums"]["email_template"];
type SuppressionReason = Database["public"]["Enums"]["email_suppression_reason"];

/**
 * Regras puras da fila — sem `import "server-only"` de propósito: nenhuma
 * delas toca banco, provedor nem segredo, então pode ser testada
 * diretamente por `tests/email-queue.test.mjs` sem precisar do client
 * `service_role` nem do processo Next.js no ar (mesmo raciocínio de
 * `src/lib/payments/webhookSignature.ts`, o único outro módulo de
 * "server-only" importado direto por um teste hoje).
 */

/** Limite de tentativas antes de marcar falha permanente (`design.md`,
 * "Envio assíncrono com novas tentativas"). */
export const MAX_ATTEMPTS = 5;

/** Backoff exponencial em minutos, com teto de 30 — não deixa a próxima
 * tentativa fugir para dias de distância num evento com prazo curto. */
export function backoffMinutes(attempts: number): number {
  return Math.min(2 ** attempts, 30);
}

/** `recibo_presente` é a única mensagem essencial hoje — ignora supressão
 * por descadastro, mas nunca ignora retorno permanente (design.md, decisão
 * "Supressão: tabela própria..."). */
export function isEssentialTemplate(template: EmailTemplate): boolean {
  return template === "recibo_presente";
}

/** `true` quando a mensagem NÃO deve ser enviada por causa de uma
 * supressão existente. */
export function isSuppressed(
  reason: SuppressionReason | null,
  template: EmailTemplate,
): boolean {
  if (!reason) return false;
  if (reason === "retorno_permanente") return true;
  return !isEssentialTemplate(template);
}
