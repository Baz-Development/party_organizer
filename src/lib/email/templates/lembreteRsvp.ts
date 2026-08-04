import { wrapHtml, wrapText } from "./base";

export interface LembreteRsvpData {
  eventTitle: string;
  guestName: string;
}

/** `link` é o RSVP com o token do convidado — mesma regra de `convite.ts`. */
export function renderLembreteRsvp(data: LembreteRsvpData, link: string, unsubscribeLink: string) {
  const subject = `Ainda dá tempo de confirmar: ${data.eventTitle}`;
  const bodyHtml = `<p>Olá, ${data.guestName}!</p><p>Ainda não vimos sua confirmação para <strong>${data.eventTitle}</strong>. Confirme sua presença:</p><p><a href="${link}">${link}</a></p>`;
  const bodyText = `Olá, ${data.guestName}!\n\nAinda não vimos sua confirmação para ${data.eventTitle}. Confirme sua presença:\n${link}`;

  return {
    subject,
    html: wrapHtml(bodyHtml, unsubscribeLink),
    text: wrapText(bodyText, unsubscribeLink),
  };
}
