/**
 * Envelope compartilhado dos modelos de mensagem — só formatação, nenhum
 * dado sensível passa por aqui além do que o próprio modelo já recebeu.
 */
export function wrapHtml(bodyHtml: string, unsubscribeLink?: string): string {
  const footer = unsubscribeLink
    ? `<p style="margin-top:24px;font-size:12px;color:#888;">Não quer mais receber e-mails deste evento? <a href="${unsubscribeLink}">Descadastrar</a>.</p>`
    : "";
  return `<div style="font-family:sans-serif;font-size:15px;color:#222;">${bodyHtml}${footer}</div>`;
}

export function wrapText(bodyText: string, unsubscribeLink?: string): string {
  const footer = unsubscribeLink
    ? `\n\n---\nNão quer mais receber e-mails deste evento? Descadastre-se: ${unsubscribeLink}`
    : "";
  return `${bodyText}${footer}`;
}

export function formatBrl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
