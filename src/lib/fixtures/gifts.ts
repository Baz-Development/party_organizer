/**
 * FIXTURE — dados falsos.
 *
 * Removido pelo change `add-gifts-payments-backend`, que cria a lista de
 * presentes, as cotas e o checkout (Pix e cartão).
 */
import type { Gift } from "@/lib/types";

export const GIFTS: Gift[] = [
  {
    id: "gi-1",
    name: "Jogo de panelas antiaderente",
    category: "Cozinha",
    price: 420,
    status: "disponivel",
    store: "Casa & Cia",
    note: "Preferência por inox, 5 peças.",
  },
  {
    id: "gi-2",
    name: "Lua de mel — cota de R$ 100",
    category: "Lua de mel",
    price: 100,
    quota: { target: 6000, raised: 3800 },
    status: "disponivel",
    note: "Cada cota ajuda a realizar a viagem dos sonhos.",
  },
  {
    id: "gi-3",
    name: "Jogo de taças de cristal",
    category: "Mesa posta",
    price: 220,
    status: "reservado",
    reservedBy: "Rafael Monteiro",
    store: "Cristais Bohemia",
  },
  {
    id: "gi-4",
    name: "Air fryer 5L",
    category: "Cozinha",
    price: 549,
    status: "comprado",
    reservedBy: "Ana Beatriz Souza",
    store: "Eletro Center",
  },
  {
    id: "gi-5",
    name: "Jogo de cama king 400 fios",
    category: "Quarto",
    price: 380,
    status: "disponivel",
    store: "Casa & Cia",
  },
  {
    id: "gi-6",
    name: "Robô aspirador",
    category: "Casa",
    price: 1890,
    quota: { target: 1890, raised: 620 },
    status: "disponivel",
  },
  {
    id: "gi-7",
    name: "Conjunto de toalhas",
    category: "Banheiro",
    price: 240,
    status: "reservado",
    reservedBy: "Juliana Prado",
  },
  {
    id: "gi-8",
    name: "Cafeteira expressa",
    category: "Cozinha",
    price: 780,
    status: "disponivel",
    store: "Eletro Center",
  },
  {
    id: "gi-9",
    name: "Jantar romântico — cota",
    category: "Lua de mel",
    price: 150,
    quota: { target: 900, raised: 900 },
    status: "comprado",
  },
];

export const GIFT_CATEGORIES = [
  "Todos",
  "Cozinha",
  "Casa",
  "Quarto",
  "Banheiro",
  "Mesa posta",
  "Lua de mel",
];
