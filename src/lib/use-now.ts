"use client";

import { useSyncExternalStore } from "react";

/**
 * Relógio compartilhado exposto como external store.
 *
 * Ler `Date.now()` durante a renderização é impuro, e chamar setState dentro de
 * um efeito para acompanhar o tempo gera renders em cascata. `useSyncExternalStore`
 * resolve os dois: o servidor devolve sempre 0, então não há divergência de
 * hidratação, e o cliente passa a receber o timestamp real logo depois.
 */

let cachedSecond = 0;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

function getSnapshot() {
  const second = Math.floor(Date.now() / 1000);
  if (second !== cachedSecond) cachedSecond = second;
  return cachedSecond;
}

function getServerSnapshot() {
  return 0;
}

/** Timestamp em milissegundos, atualizado a cada segundo. 0 no servidor. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) * 1000;
}
