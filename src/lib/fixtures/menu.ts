/**
 * FIXTURE — dados falsos.
 *
 * Removido pelo change `add-menu-backend`, que cria as votações de bar e
 * cardápio com apuração real.
 */
import type { MenuPoll } from "@/lib/types";

export const MENU_POLLS: MenuPoll[] = [
  {
    id: "poll-0",
    course: "Bebidas",
    question: "Escolha até 2 bebidas para o bar da festa",
    closesAt: "2026-11-01",
    maxChoices: 2,
    options: [
      { id: "o-b1", name: "Caipirinha de limão", desc: "A clássica, com cachaça artesanal", votes: 96, tags: [] },
      { id: "o-b2", name: "Gin tônica", desc: "Com especiarias e frutas cítricas", votes: 81, tags: [] },
      { id: "o-b3", name: "Vinho tinto", desc: "Seleção da casa, safra 2022", votes: 63, tags: [] },
      { id: "o-b4", name: "Mocktail de frutas", desc: "Sem álcool, refrescante", votes: 47, tags: ["Sem álcool"] },
    ],
  },
  {
    id: "poll-1",
    course: "Entrada",
    question: "Qual entrada você prefere?",
    closesAt: "2026-11-01",
    maxChoices: 1,
    options: [
      { id: "o-1", name: "Bruschetta de tomate e manjericão", desc: "Pão artesanal, tomate confit e azeite trufado", votes: 42, tags: ["Vegetariano"] },
      { id: "o-2", name: "Carpaccio de carne", desc: "Rúcula, parmesão e alcaparras", votes: 31, tags: [] },
      { id: "o-3", name: "Ceviche de peixe branco", desc: "Leite de tigre suave, batata-doce e milho", votes: 55, tags: ["Sem glúten"] },
    ],
  },
  {
    id: "poll-2",
    course: "Prato principal",
    question: "Escolha até 2 opções de prato principal",
    closesAt: "2026-11-01",
    maxChoices: 2,
    options: [
      { id: "o-4", name: "Filé mignon ao molho madeira", desc: "Risoto de parmesão e legumes salteados", votes: 78, tags: [] },
      { id: "o-5", name: "Salmão grelhado", desc: "Purê de baroa e aspargos", votes: 64, tags: ["Sem glúten"] },
      { id: "o-6", name: "Risoto de funghi", desc: "Cogumelos frescos e lascas de parmesão", votes: 49, tags: ["Vegetariano"] },
      { id: "o-7", name: "Frango recheado", desc: "Ervas finas, batata rústica e farofa crocante", votes: 27, tags: [] },
    ],
  },
  {
    id: "poll-3",
    course: "Sobremesa",
    question: "E para fechar a noite?",
    closesAt: "2026-11-01",
    maxChoices: 1,
    options: [
      { id: "o-8", name: "Petit gâteau", desc: "Sorvete de creme e calda quente", votes: 88, tags: [] },
      { id: "o-9", name: "Cheesecake de frutas vermelhas", desc: "Base crocante e calda artesanal", votes: 52, tags: [] },
      { id: "o-10", name: "Mousse de maracujá", desc: "Leve, cítrica e refrescante", votes: 34, tags: ["Sem glúten"] },
    ],
  },
];
