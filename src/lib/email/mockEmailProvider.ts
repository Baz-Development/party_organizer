import { randomUUID } from "node:crypto";
import type { EmailProvider } from "./provider";

/**
 * Implementação local do envio de e-mail — nenhuma chamada de rede.
 *
 * Único provedor disponível hoje (design.md, Non-Goals). Sempre "entrega"
 * com sucesso, suficiente para exercitar o fluxo completo da fila em
 * desenvolvimento e nos testes de integração sem depender de credencial
 * real. Um provedor real entra implementando `EmailProvider` e trocando a
 * instância exportada por `src/lib/email/index.ts`.
 */
export const mockEmailProvider: EmailProvider = {
  async send() {
    return { providerMessageId: `mock_${randomUUID()}` };
  },
};
