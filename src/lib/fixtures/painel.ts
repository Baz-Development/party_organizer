/**
 * FIXTURE — dados falsos.
 *
 * "MRR" e "ticket médio" fingem um billing de assinatura que a plataforma não
 * tem: quem paga, aqui, é o convidado por um presente (`payments`), não o
 * cliente anfitrião pela página. Sem uma decisão de monetização real não há
 * número real para esses dois — os outros cartões do painel admin
 * (`src/app/admin/AdminPanel.tsx`) já saem do banco.
 */
export const PLATFORM_FINANCE = {
  receitaMes: "R$ 186.300",
  crescimento: "+18%",
  ticketMedio: "R$ 112",
};
