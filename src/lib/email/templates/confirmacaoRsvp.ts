import { wrapHtml, wrapText } from "./base";

export interface ConfirmacaoRsvpData {
  eventTitle: string;
  guestName: string;
  status: "confirmado" | "recusado";
  companions: number;
  kids: number;
}

/** Sem link/segredo — confirma os dados da própria resposta. */
export function renderConfirmacaoRsvp(data: ConfirmacaoRsvpData, unsubscribeLink: string) {
  const subject = `Resposta recebida: ${data.eventTitle}`;
  const resumo =
    data.status === "confirmado"
      ? `presença confirmada${data.companions ? `, com ${data.companions} acompanhante(s)` : ""}${data.kids ? ` e ${data.kids} criança(s)` : ""}`
      : "ausência registrada";

  const bodyHtml = `<p>Olá, ${data.guestName}!</p><p>Sua resposta para <strong>${data.eventTitle}</strong> foi registrada: ${resumo}.</p>`;
  const bodyText = `Olá, ${data.guestName}!\n\nSua resposta para ${data.eventTitle} foi registrada: ${resumo}.`;

  return {
    subject,
    html: wrapHtml(bodyHtml, unsubscribeLink),
    text: wrapText(bodyText, unsubscribeLink),
  };
}
