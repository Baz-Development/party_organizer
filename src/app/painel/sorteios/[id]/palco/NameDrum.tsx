"use client";

import { useEffect, useRef } from "react";

/**
 * Urna 3D: um cilindro de placas girando no eixo X, como o tambor de uma
 * máquina de sorteio. Tem um número fixo de faces (`FACES`) e reaproveita as
 * placas que passam por trás para mostrar o próximo nome — assim gira com
 * 5 ou 500 participantes sem criar um elemento por pessoa.
 *
 * A posição é contada em "faces": `pos = 12.5` é a metade entre a 12ª e a
 * 13ª placa da fita virtual de nomes. Em repouso a urna gira devagar; quando
 * `target` muda, acelera, desacelera por ~7 s e para exatamente na face cujo
 * nome é o do vencedor (que já veio decidido pelo servidor).
 */

const FACES = 16;
const STEP = 360 / FACES;
/** Raio em múltiplos da altura da face: 1 / (2·tan(π/FACES)). */
const RADIUS_FACTOR = 1 / (2 * Math.tan(Math.PI / FACES));
const IDLE_SPEED = 0.55;
const MAX_SPEED = 26;

export interface DrumTarget {
  /** Muda a cada sorteio — é o que dispara um novo giro. */
  key: string;
  name: string;
}

interface Spin {
  t0: number;
  p0: number;
  v0: number;
  accelMs: number;
  decelMs: number;
  d1: number;
  d2: number;
  end: number;
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * Atualiza a fita sem reembaralhar: mantém a ordem de quem continua na urna,
 * tira quem saiu e acrescenta quem entrou. Assim, entre um sorteio e outro, só
 * a placa do nome sorteado muda — o resto da urna não "pisca".
 */
function mergePool(previous: string[], next: string[]): string[] {
  if (previous.length === 0) return shuffle(next);
  const remaining = new Map<string, number>();
  for (const n of next) remaining.set(n, (remaining.get(n) ?? 0) + 1);
  const kept: string[] = [];
  for (const n of previous) {
    const left = remaining.get(n) ?? 0;
    if (left > 0) {
      kept.push(n);
      remaining.set(n, left - 1);
    }
  }
  const added = [...remaining].flatMap(([n, count]) => Array<string>(count).fill(n));
  return [...kept, ...shuffle(added)];
}

export function NameDrum({
  names,
  target,
  onSettled,
  onTick,
}: {
  /** Quem ainda está na urna. */
  names: string[];
  target: DrumTarget | null;
  onSettled: () => void;
  onTick?: (speed: number) => void;
}) {
  const drumRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const faceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const callbacks = useRef({ onSettled, onTick });
  const state = useRef({
    pos: 0,
    last: 0,
    mode: "idle" as "idle" | "spinning" | "settled",
    spin: null as Spin | null,
    pool: [] as string[],
    pendingNames: null as string[] | null,
    overrides: new Map<number, string>(),
    winnerIndex: null as number | null,
    lastTickIndex: 0,
    lastTickAt: 0,
  });

  useEffect(() => {
    callbacks.current = { onSettled, onTick };
  }, [onSettled, onTick]);

  // Nomes novos só entram com a urna em repouso, para não trocar as placas
  // visíveis enquanto o vencedor está parado na frente.
  useEffect(() => {
    const s = state.current;
    if (s.mode === "idle" || s.pool.length === 0) s.pool = mergePool(s.pool, names);
    else s.pendingNames = names;
  }, [names]);

  // Laço de animação único: lê `state`, escreve direto no DOM (60 fps sem
  // re-render do React).
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const nameAt = (v: number) => {
      const s = state.current;
      const fixed = s.overrides.get(v);
      if (fixed !== undefined) return fixed;
      if (s.pool.length === 0) return "—";
      return s.pool[mod(v, s.pool.length)];
    };

    const render = () => {
      const s = state.current;
      if (drumRef.current) {
        drumRef.current.style.transform = `translateZ(calc(var(--face-h) * ${-RADIUS_FACTOR})) rotateX(${s.pos * STEP}deg)`;
      }
      for (let f = 0; f < FACES; f++) {
        const el = faceRefs.current[f];
        if (!el) continue;
        const v = f + FACES * Math.round((s.pos - f) / FACES);
        const label = nameAt(v);
        const span = el.firstElementChild as HTMLElement | null;
        if (span && span.textContent !== label) span.textContent = label;
        const angle = ((v - s.pos) * STEP * Math.PI) / 180;
        const facing = Math.max(0, Math.cos(angle));
        el.style.opacity = String(0.08 + 0.92 * facing ** 2.2);
        const isWinner = s.mode === "settled" && v === s.winnerIndex;
        el.dataset.winner = isWinner ? "true" : "false";
        el.dataset.front = Math.abs(v - s.pos) < 0.5 ? "true" : "false";
      }
    };

    const frame = (now: number) => {
      const s = state.current;
      const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 0;
      s.last = now;

      let speed = 0;
      if (s.spin) {
        const sp = s.spin;
        const t = now - sp.t0;
        if (t < sp.accelMs) {
          const secs = t / 1000;
          const a = (MAX_SPEED - sp.v0) / (sp.accelMs / 1000);
          s.pos = sp.p0 + sp.v0 * secs + 0.5 * a * secs * secs;
          speed = sp.v0 + a * secs;
        } else if (t < sp.accelMs + sp.decelMs) {
          const x = (t - sp.accelMs) / sp.decelMs;
          // easeOutQuart: começa na velocidade máxima e "pesa" no final.
          s.pos = sp.p0 + sp.d1 + sp.d2 * (1 - (1 - x) ** 4);
          speed = ((4 * sp.d2) / (sp.decelMs / 1000)) * (1 - x) ** 3;
        } else {
          s.pos = sp.end;
          s.spin = null;
          s.mode = "settled";
          if (windowRef.current) windowRef.current.dataset.spinning = "false";
          callbacks.current.onSettled();
        }

        const index = Math.round(s.pos);
        if (index !== s.lastTickIndex) {
          s.lastTickIndex = index;
          // Na velocidade máxima passam ~26 nomes/s: limitar evita virar ruído.
          if (now - s.lastTickAt > 38) {
            s.lastTickAt = now;
            callbacks.current.onTick?.(speed);
          }
        }
      } else if (s.mode === "idle" && !reduced) {
        s.pos += IDLE_SPEED * dt;
      }

      render();
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Novo alvo: monta o giro até a face do vencedor.
  useEffect(() => {
    const s = state.current;
    if (!target) {
      // De volta ao repouso: aplica a lista nova que esperava.
      s.mode = "idle";
      s.winnerIndex = null;
      // O vencedor fixado na placa sai junto: ele não está mais na urna.
      s.overrides = new Map();
      if (s.pendingNames) {
        s.pool = mergePool(s.pool, s.pendingNames);
        s.pendingNames = null;
      }
      return;
    }

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const accelMs = reduced ? 0 : 900;
    const decelMs = reduced ? 1400 : 6400;
    const p0 = s.pos;
    const v0 = s.mode === "idle" && !reduced ? IDLE_SPEED : 0;
    const d1 = ((v0 + MAX_SPEED) / 2) * (accelMs / 1000);
    const end = Math.ceil(p0 + d1 + (MAX_SPEED * (decelMs / 1000)) / 4);

    s.overrides = new Map([[end, target.name]]);
    // Sem o vencedor colado nas placas vizinhas — evitaria um "quase" falso.
    if (s.pool.length > 1) {
      const others = s.pool.filter((n) => n !== target.name);
      for (const offset of [-2, -1, 1, 2]) {
        const v = end + offset;
        if (s.pool[mod(v, s.pool.length)] === target.name && others.length > 0) {
          s.overrides.set(v, others[Math.floor(Math.random() * others.length)]);
        }
      }
    }

    s.winnerIndex = end;
    s.mode = "spinning";
    s.spin = { t0: performance.now(), p0, v0, accelMs, decelMs, d1, d2: end - p0 - d1, end };
    s.lastTickIndex = Math.round(p0);
    if (windowRef.current) windowRef.current.dataset.spinning = "true";
  }, [target]);

  return (
    <div
      className="relative mx-auto w-full max-w-[880px] select-none"
      style={
        {
          // Limitada também pela largura: no celular em pé a altura sobra e o nome não caberia.
          "--face-h": "clamp(50px, min(10.5vh, 15vw), 116px)",
          height: "calc(var(--face-h) * 5.4)",
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      {/* Moldura da janela da urna: duas réguas douradas e setas laterais. */}
      <div
        ref={windowRef}
        data-spinning="false"
        className="stage-window pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-2xl border-y-2 border-[color-mix(in_srgb,var(--accent-soft)_75%,transparent)]"
        style={{ height: "calc(var(--face-h) * 1.08)" }}
      >
        <span className="absolute -left-1 top-1/2 h-0 w-0 -translate-x-full -translate-y-1/2 border-y-[14px] border-l-[20px] border-y-transparent border-l-[var(--accent-soft)]" />
        <span className="absolute -right-1 top-1/2 h-0 w-0 -translate-y-1/2 translate-x-full border-y-[14px] border-r-[20px] border-y-transparent border-r-[var(--accent-soft)]" />
      </div>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          // `perspective` vale para o filho direto — o tambor.
          perspective: "1500px",
          maskImage: "linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)",
        }}
      >
        <div
          ref={drumRef}
          className="absolute inset-x-[4%] top-1/2"
          style={{ transformStyle: "preserve-3d", height: 0 }}
        >
          {Array.from({ length: FACES }, (_, f) => (
            <div
              key={f}
              ref={(el) => {
                faceRefs.current[f] = el;
              }}
              className="stage-face absolute inset-x-0 flex items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--accent-soft)_22%,transparent)] bg-[linear-gradient(180deg,#1d1a16,#0e0d0b)] px-6 font-display font-semibold text-[#f5f3ee] data-[front=true]:text-[var(--accent-soft)]"
              style={{
                height: "var(--face-h)",
                top: "calc(var(--face-h) / -2)",
                fontSize: "min(calc(var(--face-h) * 0.44), 6.2vw)",
                transform: `rotateX(${-f * STEP}deg) translateZ(calc(var(--face-h) * ${RADIUS_FACTOR}))`,
              }}
            >
              {/* Respiro em volta do texto para o brilho do vencedor não ser cortado pelo `truncate`. */}
              <span className="truncate px-[0.5em] py-[0.25em]">—</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
