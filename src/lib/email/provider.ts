/**
 * Contrato mínimo de um provedor de e-mail transacional.
 *
 * Nenhum provedor específico (SendGrid, Resend, Postmark, ...) está decidido
 * em `proposal.md`/specs — ver design.md, Non-Goals. Esta interface existe
 * para que a troca de `mockEmailProvider.ts` por um provedor real não exija
 * tocar em schema, fila nem modelos: só numa nova implementação desta
 * interface e no ponto que a instancia (`src/lib/email/index.ts`).
 *
 * O redirecionamento/descarte fora de produção NÃO é responsabilidade do
 * provedor — fica centralizado em `processQueue.ts` (design.md, decisão
 * "mockEmailProvider e redirecionamento por ambiente").
 */
export interface EmailProvider {
  send(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{ providerMessageId: string } | { permanentFailure: true; reason: string }>;
}
