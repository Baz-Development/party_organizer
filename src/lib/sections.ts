import type { ModuleId } from "@/lib/types";

/**
 * Módulos com seção própria na página do evento, na ordem padrão. RSVP fica de
 * fora: é sempre ativo e não é uma seção da página, e sim o botão de confirmar.
 */
export const DEFAULT_SECTION_ORDER: ModuleId[] = [
  "cronograma",
  "local",
  "presentes",
  "galeria",
  "mural",
  "cardapio",
  "bar",
  "amigo-secreto",
];

/**
 * Completa a ordem salva pelo anfitrião. Ids desconhecidos ou repetidos saem;
 * seções que ficaram de fora (módulos novos, ordem salva antes deles existirem)
 * entram no fim, na ordem padrão. `null` = o anfitrião nunca reordenou.
 */
export function resolveSectionOrder(saved: readonly ModuleId[] | null | undefined): ModuleId[] {
  const known = new Set<ModuleId>(DEFAULT_SECTION_ORDER);
  const order = (saved ?? []).filter(
    (id, index, all) => known.has(id) && all.indexOf(id) === index,
  );
  return [...order, ...DEFAULT_SECTION_ORDER.filter((id) => !order.includes(id))];
}
