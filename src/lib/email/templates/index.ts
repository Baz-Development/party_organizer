import type { Database } from "@/lib/database.types";
import { type AcessoPainelData, renderAcessoPainel } from "./acessoPainel";
import { type ConfirmacaoRsvpData, renderConfirmacaoRsvp } from "./confirmacaoRsvp";
import { type ConviteData, renderConvite } from "./convite";
import { type LembreteRsvpData, renderLembreteRsvp } from "./lembreteRsvp";
import { type ReciboPresenteData, renderReciboPresente } from "./reciboPresente";
import { type RevelacaoAmigoSecretoData, renderRevelacaoAmigoSecreto } from "./revelacaoAmigoSecreto";

export type EmailTemplateName = Database["public"]["Enums"]["email_template"];

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

type TemplateRenderer = (data: object, link: string, unsubscribeLink: string) => RenderedEmail;

/**
 * Mapa `template -> render`, usado por `processQueue.ts`.
 *
 * `link` é o segredo (token/URL) resolvido na hora — não vem de `data`
 * (design.md, decisão "Modelos como funções puras"). Modelos sem link
 * próprio (`confirmacao_rsvp`, `recibo_presente`) ignoram o parâmetro. O
 * shape de `data` esperado por cada modelo já foi validado no ponto de
 * enfileiramento (`enqueueEmail`); o cast aqui só nomeia esse contrato.
 */
export const emailTemplates: Record<EmailTemplateName, TemplateRenderer> = {
  convite: (data, link, unsubscribeLink) => renderConvite(data as ConviteData, link, unsubscribeLink),
  lembrete_rsvp: (data, link, unsubscribeLink) =>
    renderLembreteRsvp(data as LembreteRsvpData, link, unsubscribeLink),
  confirmacao_rsvp: (data, _link, unsubscribeLink) =>
    renderConfirmacaoRsvp(data as ConfirmacaoRsvpData, unsubscribeLink),
  recibo_presente: (data) => renderReciboPresente(data as ReciboPresenteData),
  revelacao_amigo_secreto: (data, link, unsubscribeLink) =>
    renderRevelacaoAmigoSecreto(data as RevelacaoAmigoSecretoData, link, unsubscribeLink),
  acesso_painel: (data, link, unsubscribeLink) =>
    renderAcessoPainel(data as AcessoPainelData, link, unsubscribeLink),
};
