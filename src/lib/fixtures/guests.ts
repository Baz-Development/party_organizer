/**
 * FIXTURE — dados falsos.
 *
 * Removido pelo change `add-guests-rsvp-backend`, que cria as tabelas de
 * convidados, convites e respostas de RSVP. Até lá, as telas de convidados e
 * de RSVP mostram esta lista para qualquer evento.
 */
import type { Guest } from "@/lib/types";

export const GUESTS: Guest[] = [
  {
    id: "g-1",
    name: "Ana Beatriz Souza",
    group: "Família da noiva",
    email: "ana.souza@email.com",
    phone: "(11) 98888-1010",
    status: "confirmado",
    companions: 1,
    kids: 0,
    dietary: "Vegetariana",
    invitedAt: "2026-05-02",
    respondedAt: "2026-05-06",
  },
  {
    id: "g-2",
    name: "Carlos Eduardo Lima",
    group: "Amigos do noivo",
    email: "cadu.lima@email.com",
    phone: "(11) 97777-2020",
    status: "confirmado",
    companions: 1,
    kids: 2,
    invitedAt: "2026-05-02",
    respondedAt: "2026-05-04",
  },
  {
    id: "g-3",
    name: "Fernanda Torres",
    group: "Trabalho",
    email: "fe.torres@email.com",
    status: "pendente",
    companions: 0,
    kids: 0,
    invitedAt: "2026-05-02",
  },
  {
    id: "g-4",
    name: "João Pedro Alves",
    group: "Amigos do noivo",
    email: "jp.alves@email.com",
    phone: "(11) 96666-3030",
    status: "recusado",
    companions: 0,
    kids: 0,
    invitedAt: "2026-05-02",
    respondedAt: "2026-05-11",
  },
  {
    id: "g-5",
    name: "Marina Costa Ferreira",
    group: "Família da noiva",
    email: "marina.cf@email.com",
    status: "confirmado",
    companions: 2,
    kids: 1,
    dietary: "Alergia a nozes",
    invitedAt: "2026-05-02",
    respondedAt: "2026-05-03",
  },
  {
    id: "g-6",
    name: "Rafael Monteiro",
    group: "Padrinhos",
    email: "rafa.monteiro@email.com",
    phone: "(11) 95555-4040",
    status: "confirmado",
    companions: 1,
    kids: 0,
    invitedAt: "2026-04-28",
    respondedAt: "2026-04-29",
  },
  {
    id: "g-7",
    name: "Juliana Prado",
    group: "Padrinhos",
    email: "ju.prado@email.com",
    status: "pendente",
    companions: 0,
    kids: 0,
    invitedAt: "2026-04-28",
  },
  {
    id: "g-8",
    name: "Henrique Barbosa",
    group: "Família do noivo",
    email: "henrique.b@email.com",
    status: "confirmado",
    companions: 0,
    kids: 0,
    dietary: "Sem glúten",
    invitedAt: "2026-05-02",
    respondedAt: "2026-05-15",
  },
  {
    id: "g-9",
    name: "Patrícia Nogueira",
    group: "Trabalho",
    email: "paty.n@email.com",
    status: "pendente",
    companions: 0,
    kids: 0,
    invitedAt: "2026-05-09",
  },
  {
    id: "g-10",
    name: "Lucas Meireles",
    group: "Amigos do noivo",
    email: "lucas.m@email.com",
    status: "confirmado",
    companions: 1,
    kids: 0,
    invitedAt: "2026-05-09",
    respondedAt: "2026-05-18",
  },
  {
    id: "g-11",
    name: "Beatriz Camargo",
    group: "Família da noiva",
    email: "bia.camargo@email.com",
    status: "recusado",
    companions: 0,
    kids: 0,
    invitedAt: "2026-05-09",
    respondedAt: "2026-05-20",
  },
  {
    id: "g-12",
    name: "Rodrigo Tavares",
    group: "Trabalho",
    email: "rodrigo.t@email.com",
    status: "pendente",
    companions: 0,
    kids: 0,
    invitedAt: "2026-05-09",
  },
];

export const GUEST_GROUPS = [
  "Família da noiva",
  "Família do noivo",
  "Padrinhos",
  "Amigos do noivo",
  "Trabalho",
];

export function guestStats(guests: Guest[] = GUESTS) {
  const confirmados = guests.filter((g) => g.status === "confirmado");
  const recusados = guests.filter((g) => g.status === "recusado");
  const pendentes = guests.filter((g) => g.status === "pendente");
  const totalPessoas = confirmados.reduce(
    (acc, g) => acc + 1 + g.companions + g.kids,
    0,
  );
  return {
    convidados: guests.length,
    confirmados: confirmados.length,
    recusados: recusados.length,
    pendentes: pendentes.length,
    totalPessoas,
    criancas: confirmados.reduce((acc, g) => acc + g.kids, 0),
    restricoes: guests.filter((g) => !!g.dietary).length,
    taxaResposta: Math.round(
      ((confirmados.length + recusados.length) / guests.length) * 100,
    ),
  };
}
