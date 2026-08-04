import { wrapHtml, wrapText } from "./base";

export interface RevelacaoAmigoSecretoData {
  eventTitle: string;
}

/**
 * NUNCA recebe nem inclui o nome de quem foi sorteado — só o link da própria
 * revelação de quem recebe este e-mail ("Requirement: Modelos de mensagem do
 * produto", cenário "Revelação do amigo secreto"). `link` é a página de
 * revelação com o token do participante, resolvido pelo processador da fila
 * na hora de renderizar — nunca persistido.
 */
export function renderRevelacaoAmigoSecreto(
  data: RevelacaoAmigoSecretoData,
  link: string,
  unsubscribeLink: string,
) {
  const subject = `O sorteio saiu: ${data.eventTitle}`;
  const bodyHtml = `<p>O sorteio do amigo secreto de <strong>${data.eventTitle}</strong> já saiu!</p><p>Descubra quem você tirou:</p><p><a href="${link}">${link}</a></p>`;
  const bodyText = `O sorteio do amigo secreto de ${data.eventTitle} já saiu!\n\nDescubra quem você tirou:\n${link}`;

  return {
    subject,
    html: wrapHtml(bodyHtml, unsubscribeLink),
    text: wrapText(bodyText, unsubscribeLink),
  };
}
