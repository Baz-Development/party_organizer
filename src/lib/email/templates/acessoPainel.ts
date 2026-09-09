import { wrapHtml, wrapText } from "./base";

export interface AcessoPainelData {
  eventTitle: string;
  /** Slug e id da página, usados pelo processador da fila para montar `pageUrl`. */
  eventSlug?: string;
  eventId?: string;
  /** E-mail com que o cliente entra na plataforma. Não é segredo — o acesso
   * continua sendo por link mágico. */
  loginEmail?: string;
  /** URL pública da página do evento (`/[id]/[slug]`), resolvida na fila. */
  pageUrl?: string;
  /** URL onde o cliente pede o link de entrada (`/entrar`), resolvida na fila. */
  loginUrl?: string;
}

/**
 * `link` é a URL pública do painel (`/painel`) — não carrega nenhum segredo:
 * quem administra o evento continua precisando entrar pelo link mágico do
 * Supabase Auth. Esta mensagem existe como lembrete de acesso e agora também
 * aponta a página criada e diz com qual e-mail a pessoa entra.
 */
export function renderAcessoPainel(data: AcessoPainelData, link: string, unsubscribeLink: string) {
  const subject = `Acesse o painel de ${data.eventTitle}`;

  const pageLineHtml = data.pageUrl
    ? `<p>A página do evento está no ar: <a href="${data.pageUrl}">${data.pageUrl}</a></p>`
    : "";
  const loginLineHtml = data.loginEmail
    ? `<p>Entre com o e-mail <strong>${data.loginEmail}</strong>${
        data.loginUrl
          ? `, pedindo o link de acesso em <a href="${data.loginUrl}">${data.loginUrl}</a>`
          : ""
      }. O login é sempre por link enviado ao seu e-mail — não há senha.</p>`
    : "";

  const bodyHtml =
    `<p>O painel de <strong>${data.eventTitle}</strong> está pronto para acompanhamento.</p>` +
    pageLineHtml +
    loginLineHtml +
    `<p>Painel: <a href="${link}">${link}</a></p>`;

  const pageLineText = data.pageUrl ? `\nPágina do evento: ${data.pageUrl}` : "";
  const loginLineText = data.loginEmail
    ? `\nEntre com o e-mail ${data.loginEmail}${
        data.loginUrl ? `, pedindo o link de acesso em ${data.loginUrl}` : ""
      }. O login é sempre por link enviado ao seu e-mail — não há senha.`
    : "";
  const bodyText =
    `O painel de ${data.eventTitle} está pronto para acompanhamento.` +
    pageLineText +
    loginLineText +
    `\nPainel: ${link}`;

  return {
    subject,
    html: wrapHtml(bodyHtml, unsubscribeLink),
    text: wrapText(bodyText, unsubscribeLink),
  };
}
