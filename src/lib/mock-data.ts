/**
 * Fonte do seed de desenvolvimento — **não importe daqui em páginas ou rotas**.
 *
 * `npm run db:seed` lê este arquivo e gera `supabase/seed.sql`. Mudou um evento
 * de exemplo aqui? Rode o seed de novo e o diff do SQL mostra exatamente o que
 * muda no banco.
 *
 * Quem precisa de eventos em tempo de execução usa `src/lib/db/`, que lê do
 * banco. Os mocks das telas ainda não migradas ficam em `src/lib/fixtures/`.
 */
import type { EventSummary } from "./types";

/**
 * A galeria não faz parte do seed: fotos e recados nascem de envio de
 * convidado, não de dado fixo. `coverUrl`/`coverPath` também ficam de fora —
 * a capa é um upload real no bucket `event-media`, sem equivalente estático.
 */
type SeedEvent = Omit<EventSummary, "gallery" | "coverUrl" | "coverPath">;

export const EVENTS: SeedEvent[] = [
  {
    id: "ev-1",
    slug: "marina-e-thiago",
    title: "Marina & Thiago",
    kind: "casamento",
    date: "2026-12-12T16:00:00",
    venue: "Fazenda Santa Clara",
    city: "Itu – SP",
    hosts: "Marina & Thiago",
    eyebrow: "Estamos casando",
    welcome:
      "Com o coração transbordando, convidamos você para celebrar conosco o início de uma nova jornada. Sua presença é o presente que mais desejamos.",
    themeKey: "terracota",
    modules: [
      "rsvp",
      "cronograma",
      "local",
      "presentes",
      "galeria",
      "mural",
      "cardapio",
      "amigo-secreto",
    ],
    schedule: [
      { time: "16h00", title: "Cerimônia", desc: "Capela Santa Clara" },
      { time: "17h30", title: "Recepção", desc: "Jardim principal — coquetel" },
      { time: "19h00", title: "Jantar", desc: "Salão principal" },
      { time: "21h00", title: "Festa", desc: "Pista de dança até 02h" },
    ],
    status: "publicado",
    guestListOpen: false,
    moderationPolicy: "previa",
  },
  {
    id: "ev-2",
    slug: "15-anos-sofia",
    title: "15 Anos da Sofia",
    kind: "debutante",
    date: "2026-09-05T20:00:00",
    venue: "Espaço Villa Nova",
    city: "Campinas – SP",
    hosts: "Sofia Andrade",
    eyebrow: "Meus 15 anos",
    welcome:
      "Chegou a hora de celebrar! Venha comigo viver uma noite inesquecível cheia de música, dança e muito brilho.",
    themeKey: "dourado",
    modules: ["rsvp", "cronograma", "local", "galeria", "mural", "cardapio"],
    schedule: [
      { time: "20h00", title: "Recepção", desc: "Coquetel de boas-vindas" },
      { time: "21h00", title: "Valsa", desc: "Entrada da debutante" },
      { time: "22h00", title: "Jantar", desc: "Buffet completo" },
      { time: "23h30", title: "Balada", desc: "DJ até 03h" },
    ],
    status: "publicado",
    guestListOpen: false,
    moderationPolicy: "previa",
  },
  {
    id: "ev-3",
    slug: "aniversario-do-bento",
    title: "Bento faz 5 anos",
    kind: "infantil",
    date: "2026-08-22T15:00:00",
    venue: "Buffet Mundo Mágico",
    city: "São Paulo – SP",
    hosts: "Família Ribeiro",
    eyebrow: "Festa do Bento",
    welcome:
      "O Bento está fazendo 5 aninhos e quer muito comemorar com você! Vai ter bolo, brincadeira e bagunça boa.",
    themeKey: "oliva",
    modules: ["rsvp", "cronograma", "local", "presentes", "galeria"],
    schedule: [
      { time: "15h00", title: "Abertura", desc: "Recepção e brinquedos" },
      { time: "16h00", title: "Show", desc: "Contação de histórias" },
      { time: "17h00", title: "Parabéns", desc: "Bolo e docinhos" },
      { time: "18h30", title: "Encerramento", desc: "Entrega das lembrancinhas" },
    ],
    status: "rascunho",
    guestListOpen: false,
    moderationPolicy: "previa",
  },
  {
    id: "ev-4",
    slug: "convencao-nexus-2026",
    title: "Convenção Nexus 2026",
    kind: "corporativo",
    date: "2026-10-14T09:00:00",
    venue: "Centro de Convenções Anhembi",
    city: "São Paulo – SP",
    hosts: "Nexus Tecnologia",
    eyebrow: "Encontro anual",
    welcome:
      "Um dia inteiro de conteúdo, networking e celebração dos resultados do ano. Confirme sua presença e garanta seu crachá.",
    themeKey: "marinho",
    modules: ["rsvp", "cronograma", "local", "galeria"],
    schedule: [
      { time: "09h00", title: "Credenciamento", desc: "Café de boas-vindas" },
      { time: "10h00", title: "Keynote", desc: "Abertura com a diretoria" },
      { time: "12h30", title: "Almoço", desc: "Área externa" },
      { time: "14h00", title: "Painéis", desc: "Três trilhas simultâneas" },
    ],
    status: "publicado",
    guestListOpen: false,
    moderationPolicy: "previa",
  },
];
