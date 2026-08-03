import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verificação de assinatura do webhook de pagamento.
 *
 * HMAC-SHA256 sobre o corpo bruto da requisição, cabeçalho
 * `x-webhook-signature: sha256=<hex>` — o desenho mais comum entre provedores
 * reais (design.md, decisão 7). Recebe o corpo **bruto** (antes de
 * `JSON.parse`): reserializar o JSON para verificar mudaria espaçamento e
 * ordem de chave, invalidando qualquer assinatura de provedor real.
 *
 * Comparação em tempo constante (`timingSafeEqual`) para não vazar, por
 * tempo de resposta, quantos bytes da assinatura esperada bateram.
 */
export function verifyWebhookSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = header.startsWith("sha256=") ? header.slice("sha256=".length) : header;

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(received, "hex");

  if (expectedBuf.length !== receivedBuf.length || receivedBuf.length === 0) return false;

  return timingSafeEqual(expectedBuf, receivedBuf);
}
