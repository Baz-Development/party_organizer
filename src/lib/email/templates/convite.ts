import { wrapHtml, wrapText } from "./base";

export interface ConviteData {
  eventTitle: string;
  guestName: string;
}

/** `link` é o RSVP com o token do convidado, resolvido pelo processador da
 * fila na hora de renderizar — nunca persistido em `email_messages.data`. */
export function renderConvite(data: ConviteData, link: string, unsubscribeLink: string) {
  const subject = `Você foi convidado: ${data.eventTitle}`;
  const bodyHtml = `<p>Olá, ${data.guestName}!</p><p>Você foi convidado para <strong>${data.eventTitle}</strong>. Confirme sua presença:</p><p><a href="${link}">${link}</a></p>`;
  const bodyText = `Olá, ${data.guestName}!\n\nVocê foi convidado para ${data.eventTitle}. Confirme sua presença:\n${link}`;

  return {
    subject,
    html: wrapHtml(bodyHtml, unsubscribeLink),
    text: wrapText(bodyText, unsubscribeLink),
  };
}
