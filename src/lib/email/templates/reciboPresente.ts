import { formatBrl, wrapHtml, wrapText } from "./base";

export interface ReciboPresenteData {
  eventTitle: string;
  buyerName: string;
  giftName: string;
  amountCents: number;
}

/**
 * Mensagem essencial — ignora supressão por descadastro (não por retorno
 * permanente), então nunca leva link de descadastro (design.md, decisão
 * "Supressão"). É resposta direta ao pagamento, não comunicação recorrente.
 */
export function renderReciboPresente(data: ReciboPresenteData) {
  const subject = `Recibo: ${data.giftName} — ${data.eventTitle}`;
  const valor = formatBrl(data.amountCents);
  const bodyHtml = `<p>Olá, ${data.buyerName}!</p><p>Recebemos sua contribuição de <strong>${valor}</strong> para <strong>${data.giftName}</strong>, presente de <strong>${data.eventTitle}</strong>. Obrigado!</p>`;
  const bodyText = `Olá, ${data.buyerName}!\n\nRecebemos sua contribuição de ${valor} para ${data.giftName}, presente de ${data.eventTitle}. Obrigado!`;

  return { subject, html: wrapHtml(bodyHtml), text: wrapText(bodyText) };
}
