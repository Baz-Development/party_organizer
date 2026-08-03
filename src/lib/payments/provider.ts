/**
 * Contrato mínimo de um provedor de checkout hospedado.
 *
 * Nenhum provedor específico (Stripe, Mercado Pago, PagSeguro, ...) está
 * decidido em `proposal.md`/specs, e o repositório não tem convenção de SDK de
 * pagamento hoje — ver design.md, decisão 7. Esta interface existe para que a
 * troca de `mockProvider.ts` por um provedor real não exija tocar em schema,
 * RLS, nem nas rotas de checkout/webhook: só numa nova implementação desta
 * interface e no ponto que a instancia (`src/lib/payments/index.ts`).
 */
export interface PaymentProvider {
  /**
   * Abre uma sessão de checkout hospedado para um pagamento já criado no
   * banco (`start_gift_checkout`). `paymentId` é o `uuid` interno, enviado
   * como referência para o provedor devolver no webhook.
   */
  createCheckoutSession(input: {
    paymentId: string;
    amountCents: number;
    currency: string;
    description: string;
  }): Promise<{ providerPaymentId: string; checkoutUrl: string }>;
}
