/**
 * FIXTURE — dados falsos.
 *
 * Removido pelo change `add-media-backend`, que cria o storage de imagens, a
 * galeria colaborativa e o mural de recados com moderação.
 *
 * `EVENT_GALLERIES` existe porque `EventSummary.gallery` faz parte do contrato
 * de `src/lib/types.ts`, mas não há tabela de fotos ainda: a camada de dados
 * devolve galeria vazia e as páginas compõem com esta fixture, por slug.
 */
import type { MuralMessage, Photo } from "@/lib/types";

export const EVENT_GALLERIES: Record<string, string[]> = {
  "marina-e-thiago": [
    "Noivado no campo",
    "Ensaio na fazenda",
    "Pedido de casamento",
    "Chá de panela",
    "Viagem a dois",
    "Retrato do casal",
  ],
  "15-anos-sofia": [
    "Ensaio",
    "Prova do vestido",
    "Amigas",
    "Família",
    "Bolo",
    "Decoração",
  ],
  "aniversario-do-bento": [
    "Bento",
    "Tema da festa",
    "Bolo",
    "Decoração",
    "Convite",
    "Lembrancinha",
  ],
  "convencao-nexus-2026": [
    "Palco",
    "Plateia",
    "Networking",
    "Coffee break",
    "Painel",
    "Time",
  ],
};

/** Galeria de um evento; vazia para qualquer slug criado de verdade. */
export function galleryFor(slug: string): string[] {
  return EVENT_GALLERIES[slug] ?? [];
}

export const PHOTOS: Photo[] = [
  { id: "ph-1", author: "Ana Beatriz", caption: "Chegando na fazenda!", at: "há 2 h", likes: 24, approved: true },
  { id: "ph-2", author: "Carlos Eduardo", caption: "Os padrinhos", at: "há 3 h", likes: 18, approved: true },
  { id: "ph-3", author: "Marina Costa", caption: "Detalhes da decoração", at: "há 4 h", likes: 41, approved: true },
  { id: "ph-4", author: "Rafael Monteiro", caption: "Bastidores", at: "há 5 h", likes: 12, approved: true },
  { id: "ph-5", author: "Juliana Prado", caption: "Brinde!", at: "há 6 h", likes: 33, approved: true },
  { id: "ph-6", author: "Henrique Barbosa", at: "há 7 h", likes: 9, approved: true },
  { id: "ph-7", author: "Lucas Meireles", caption: "Pista cheia", at: "há 8 h", likes: 27, approved: false },
  { id: "ph-8", author: "Patrícia Nogueira", caption: "Mesa dos doces", at: "há 9 h", likes: 15, approved: false },
  { id: "ph-9", author: "Beatriz Camargo", at: "há 10 h", likes: 6, approved: true },
];

export const MURAL: MuralMessage[] = [
  {
    id: "mu-1",
    author: "Ana Beatriz Souza",
    message:
      "Que vocês tenham uma vida inteira tão bonita quanto esse dia. Amo vocês demais!",
    at: "há 1 h",
    likes: 32,
    approved: true,
  },
  {
    id: "mu-2",
    author: "Rafael Monteiro",
    message: "Thiago, quem diria! Felicidades pro casal, contem sempre comigo.",
    at: "há 3 h",
    likes: 21,
    approved: true,
  },
  {
    id: "mu-3",
    author: "Juliana Prado",
    message:
      "Marina, você estava simplesmente radiante. Obrigada por me deixar fazer parte desse momento.",
    at: "há 4 h",
    likes: 45,
    approved: true,
  },
  {
    id: "mu-4",
    author: "Carlos Eduardo Lima",
    message: "Festa inesquecível! Já quero a próxima.",
    at: "há 5 h",
    likes: 11,
    approved: true,
  },
  {
    id: "mu-5",
    author: "Convidado anônimo",
    message: "Teste de recado ainda não aprovado pelos noivos.",
    at: "há 6 h",
    likes: 0,
    approved: false,
  },
];
