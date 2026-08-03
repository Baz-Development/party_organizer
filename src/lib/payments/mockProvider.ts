import { randomUUID } from "node:crypto";
import type { PaymentProvider } from "./provider";

/**
 * Implementação local do checkout hospedado — nenhuma chamada de rede.
 *
 * Único provedor disponível hoje (ver design.md, decisão 7). Suficiente para
 * exercitar o fluxo completo — criar checkout, "pagar" simulando o webhook,
 * confirmar — em desenvolvimento e nos testes de integração, sem depender de
 * credencial real. Um provedor real entra implementando `PaymentProvider` e
 * trocando a instância exportada por `src/lib/payments/index.ts`.
 */
export const mockProvider: PaymentProvider = {
  async createCheckoutSession({ paymentId }) {
    const providerPaymentId = `mock_${randomUUID()}`;
    return {
      providerPaymentId,
      checkoutUrl: `/pagamentos/simulado/${paymentId}?provider_payment_id=${providerPaymentId}`,
    };
  },
};
