import type { Raffle, RafflePrize } from "./types";

/**
 * Espelho, no cliente, da regra de vaga de `draw_raffle_winner`: prêmios na
 * ordem de `position`, cada um com `quantity` vencedores; depois, os
 * suplentes. Serve só para o palco e o painel mostrarem "o que vem agora" —
 * quem decide de verdade a vaga de cada nome é o banco.
 */

export type RaffleSlot =
  | { kind: "premio"; prize: RafflePrize; /** 1 = primeiro vencedor deste prêmio. */ unit: number }
  | { kind: "suplente"; /** 1 = primeiro suplente. */ unit: number };

type SlotSource = Pick<Raffle, "prizes" | "results" | "alternatesCount">;

function validCount(raffle: SlotSource, prizeId: string | undefined): number {
  return raffle.results.filter((r) => r.status === "valido" && r.prizeId === prizeId).length;
}

/** Próxima vaga a ser sorteada, ou `null` quando todas foram preenchidas. */
export function nextSlot(raffle: SlotSource): RaffleSlot | null {
  for (const prize of raffle.prizes) {
    const filled = validCount(raffle, prize.id);
    if (filled < prize.quantity) return { kind: "premio", prize, unit: filled + 1 };
  }
  const alternates = validCount(raffle, undefined);
  if (alternates < raffle.alternatesCount) return { kind: "suplente", unit: alternates + 1 };
  return null;
}

/** Total de nomes que o sorteio vai tirar (vencedores + suplentes). */
export function totalSlots(raffle: Pick<Raffle, "prizes" | "alternatesCount">): number {
  return raffle.prizes.reduce((acc, p) => acc + p.quantity, 0) + raffle.alternatesCount;
}

/** Participantes que ainda estão na urna: quem já saiu (válido ou ausente) não volta. */
export function remainingPool<T extends Pick<Raffle, "participants" | "results">>(
  raffle: T,
): T["participants"] {
  const drawn = new Set(raffle.results.map((r) => r.participantId));
  return raffle.participants.filter((p) => !drawn.has(p.id));
}
