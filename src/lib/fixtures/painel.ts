/**
 * FIXTURE — dados falsos.
 *
 * Feed de atividade e métricas agregadas da plataforma. Ainda não têm change
 * próprio: dependem dos módulos que geram os eventos (RSVP, presentes, mídia)
 * e de uma decisão sobre observabilidade e billing.
 *
 * As contagens que **já** são reais — total de eventos e eventos ativos por
 * organização — vêm de `src/lib/db/organizations.ts`, não daqui.
 */
import type { Activity } from "@/lib/types";

export const ACTIVITY: Activity[] = [
  { id: "ac-1", at: "há 12 min", who: "Ana Beatriz Souza", what: "confirmou presença (+1 acompanhante)", kind: "rsvp" },
  { id: "ac-2", at: "há 48 min", who: "Rafael Monteiro", what: "reservou “Jogo de taças de cristal”", kind: "presente" },
  { id: "ac-3", at: "há 2 h", who: "Marina Costa", what: "enviou 3 fotos para a galeria", kind: "foto" },
  { id: "ac-4", at: "há 3 h", who: "Juliana Prado", what: "deixou um recado no mural", kind: "mural" },
  { id: "ac-5", at: "há 5 h", who: "João Pedro Alves", what: "recusou o convite", kind: "rsvp" },
  { id: "ac-6", at: "ontem", who: "Sistema", what: "lembrete de RSVP enviado para 12 convidados", kind: "sistema" },
  { id: "ac-7", at: "ontem", who: "Ana Beatriz Souza", what: "comprou “Air fryer 5L”", kind: "presente" },
];

/**
 * Métricas financeiras da plataforma. Dependem de billing, que não existe.
 *
 * Contagem de eventos e de organizações **não** está aqui: essas são reais e
 * saem do banco.
 */
export const PLATFORM_FINANCE = {
  convidadosMes: 28450,
  receitaMes: "R$ 186.300",
  crescimento: "+18%",
  ticketMedio: "R$ 112",
};

/** Série simplificada para o gráfico de barras do painel admin. */
export const ADMIN_SERIES = [
  { label: "Fev", value: 42 },
  { label: "Mar", value: 55 },
  { label: "Abr", value: 61 },
  { label: "Mai", value: 58 },
  { label: "Jun", value: 74 },
  { label: "Jul", value: 88 },
  { label: "Ago", value: 96 },
];
