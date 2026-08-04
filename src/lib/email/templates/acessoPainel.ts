import { wrapHtml, wrapText } from "./base";

export interface AcessoPainelData {
  eventTitle: string;
}

/**
 * `link` é a URL pública do painel (`/painel`) — não carrega nenhum segredo:
 * quem administra o evento continua precisando entrar pelo magic link do
 * Supabase Auth. Existe só como lembrete de acesso, não como capability.
 */
export function renderAcessoPainel(data: AcessoPainelData, link: string, unsubscribeLink: string) {
  const subject = `Acesse o painel de ${data.eventTitle}`;
  const bodyHtml = `<p>O painel de <strong>${data.eventTitle}</strong> está pronto para acompanhamento.</p><p><a href="${link}">${link}</a></p>`;
  const bodyText = `O painel de ${data.eventTitle} está pronto para acompanhamento.\n${link}`;

  return {
    subject,
    html: wrapHtml(bodyHtml, unsubscribeLink),
    text: wrapText(bodyText, unsubscribeLink),
  };
}
