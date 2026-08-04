import "server-only";

import { mockEmailProvider } from "./mockEmailProvider";
import type { EmailProvider } from "./provider";

/**
 * Ponto único de instanciação do provedor de e-mail ativo.
 *
 * Hoje só existe `mockEmailProvider` (design.md, Non-Goals). Trocar por um
 * provedor real é alterar esta linha, não mexer em quem consome
 * `emailProvider`. Espelha `src/lib/payments/index.ts`.
 */
export const emailProvider: EmailProvider = mockEmailProvider;

export type { EmailProvider } from "./provider";
