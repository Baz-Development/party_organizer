import "server-only";

import { mockProvider } from "./mockProvider";
import type { PaymentProvider } from "./provider";

/**
 * Ponto único de instanciação do provedor de pagamento ativo.
 *
 * Hoje só existe `mockProvider` (design.md, decisão 7). Trocar por um
 * provedor real é alterar esta linha para escolher a implementação com base
 * em uma variável de ambiente (`PAYMENT_PROVIDER`, por exemplo), não mexer em
 * quem consome `paymentProvider`.
 */
export const paymentProvider: PaymentProvider = mockProvider;

export type { PaymentProvider } from "./provider";
