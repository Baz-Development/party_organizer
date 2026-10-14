/**
 * Faixas do contador "+N festas organizadas" da landing.
 *
 *   0 a 100        -> unidade            (step 1)
 *   100 a 1.000    -> centenas           (step 100)
 *   1.000 a 100.000 -> milhares          (step 1.000)
 *   100.000 em diante -> centenas de milhares (step 100.000)
 *
 * O valor é arredondado para BAIXO dentro da faixa, então o "+" nunca promete
 * mais do que existe. Zero significa "não mostrar".
 */
export function proofCount(published: number): number {
  const n = Math.max(0, Math.floor(published));
  const step = n < 100 ? 1 : n < 1_000 ? 100 : n < 100_000 ? 1_000 : 100_000;
  return Math.floor(n / step) * step;
}
