import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { verifyWebhookSignature } from "../src/lib/payments/webhookSignature.ts";

/**
 * `verifyWebhookSignature` é a porta de entrada do
 * "Requirement: Confirmação exclusivamente por webhook assinado" — a rota
 * `POST /api/pagamentos/webhook` só chama `process_payment_event` (testado
 * de ponta a ponta em `tests/payments.test.mjs`, com o mesmo client
 * `service_role` que a rota usa) depois que esta função aprova a assinatura.
 * Sem servidor Next.js rodando durante `npm test`, a verificação de
 * assinatura é testada aqui isolada — o suficiente, porque é uma função pura
 * sem dependência de rede ou banco. Node 24 despe tipos de `.ts` nativamente,
 * o que permite importar o módulo direto sem build.
 */
describe("assinatura do webhook de pagamento", () => {
  const segredo = "segredo-de-teste-do-webhook";
  const corpo = JSON.stringify({ id: "evt_1", type: "aprovado", data: { payment_id: "abc" } });

  const assinar = (texto, chave) => createHmac("sha256", chave).update(texto, "utf8").digest("hex");

  it("aceita assinatura válida", () => {
    const header = `sha256=${assinar(corpo, segredo)}`;
    assert.equal(verifyWebhookSignature(corpo, header, segredo), true);
  });

  it("também aceita o hex sem o prefixo sha256=", () => {
    const header = assinar(corpo, segredo);
    assert.equal(verifyWebhookSignature(corpo, header, segredo), true);
  });

  it("recusa assinatura calculada com outro segredo", () => {
    const header = `sha256=${assinar(corpo, "segredo-errado")}`;
    assert.equal(verifyWebhookSignature(corpo, header, segredo), false);
  });

  it("recusa assinatura de um corpo diferente (payload adulterado)", () => {
    const header = `sha256=${assinar(corpo, segredo)}`;
    const corpoAdulterado = JSON.stringify({ id: "evt_1", type: "aprovado", data: { payment_id: "outro-id" } });
    assert.equal(verifyWebhookSignature(corpoAdulterado, header, segredo), false);
  });

  it("recusa cabeçalho ausente", () => {
    assert.equal(verifyWebhookSignature(corpo, null, segredo), false);
  });

  it("recusa cabeçalho vazio ou malformado", () => {
    assert.equal(verifyWebhookSignature(corpo, "sha256=", segredo), false);
    assert.equal(verifyWebhookSignature(corpo, "não-é-hex", segredo), false);
  });
});
