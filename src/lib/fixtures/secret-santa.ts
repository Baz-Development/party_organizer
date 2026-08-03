/**
 * FIXTURE — dados falsos.
 *
 * Removido pelo change `add-secret-santa-backend`, que cria o sorteio real,
 * as listas de desejo e a revelação por participante.
 */
import type { SecretSantaParticipant } from "@/lib/types";

export const SECRET_SANTA: SecretSantaParticipant[] = [
  { id: "ss-1", name: "Ana Beatriz Souza", wishlist: ["Livro de romance", "Vela aromática"], joinedAt: "2026-06-01", hasDrawn: true },
  { id: "ss-2", name: "Carlos Eduardo Lima", wishlist: ["Caneca temática", "Meias divertidas"], joinedAt: "2026-06-02", hasDrawn: true },
  { id: "ss-3", name: "Marina Costa Ferreira", wishlist: ["Kit de chá", "Planta suculenta"], joinedAt: "2026-06-02", hasDrawn: true },
  { id: "ss-4", name: "Rafael Monteiro", wishlist: ["Fone bluetooth"], joinedAt: "2026-06-03", hasDrawn: false },
  { id: "ss-5", name: "Juliana Prado", wishlist: ["Necessaire", "Perfume"], joinedAt: "2026-06-04", hasDrawn: false },
  { id: "ss-6", name: "Henrique Barbosa", wishlist: ["Jogo de tabuleiro"], joinedAt: "2026-06-05", hasDrawn: false },
];

export const SECRET_SANTA_CONFIG = {
  budget: "R$ 80",
  drawDate: "2026-11-20",
  exchangeDate: "2026-12-12",
  rules:
    "Cada participante tira um nome só depois do sorteio. O presente deve respeitar o valor combinado e será trocado durante a festa.",
};

/** Quem o convidado logado (mock) tirou. */
export const SECRET_SANTA_DRAW = {
  drawer: "Ana Beatriz Souza",
  target: "Rafael Monteiro",
  targetWishlist: ["Fone bluetooth", "Camiseta de banda", "Livro de fotografia"],
  targetNote: "Sou fácil de agradar — qualquer coisa de música me deixa feliz!",
};
