"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OpeningId } from "./pick";

/**
 * Cada abertura é um módulo com a mesma interface: desenha a capa, reconhece
 * UM gesto, toca o clímax e chama `onOpen` (uma única vez). O casco
 * (`InviteOpening`) cuida do resto: pular, confete, revelação e lembrar.
 */
export interface OpeningProps {
  onOpen: () => void;
  /** Idade do aniversariante (velas). `null` quando o título não cita. */
  age: number | null;
  /** Data por extenso, para a raspadinha. */
  dateLabel: string;
  title: string;
}

const GOLD = "var(--accent)";
const CHARCOAL = "var(--ink-charcoal, #2a2724)";

/** Dispara `onOpen` uma única vez, `delay` ms depois de `trigger()`. */
function useTrigger(onOpen: () => void, delay: number) {
  const done = useRef(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );
  return useCallback(() => {
    if (done.current) return false;
    done.current = true;
    timer.current = window.setTimeout(onOpen, delay);
    return true;
  }, [onOpen, delay]);
}

/* ------------------------------------------------------------------ */
/* Envelope com selo de cera — segurar (ou tocar)                      */
/* ------------------------------------------------------------------ */

const HOLD_MS = 800;
const RING = 2 * Math.PI * 44;

function Envelope({ onOpen, title }: OpeningProps) {
  const [opened, setOpened] = useState(false);
  const [holding, setHolding] = useState(false);
  const trigger = useTrigger(onOpen, 1500);
  const holdTimer = useRef<number | null>(null);

  const open = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (trigger()) setOpened(true);
  };
  const startHold = () => {
    if (opened) return;
    setHolding(true);
    holdTimer.current = window.setTimeout(open, HOLD_MS);
  };
  const cancelHold = () => {
    setHolding(false);
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
  };
  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
  }, []);

  const ease = "transition-all duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none";

  return (
    <div className="relative h-[270px] w-[min(360px,86vw)]" style={{ perspective: 1100 }}>
      <div
        className="absolute inset-x-0 bottom-0 h-[220px] rounded-[10px]"
        style={{
          background: `linear-gradient(160deg, color-mix(in srgb, ${CHARCOAL} 92%, white), ${CHARCOAL})`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
        }}
      />
      {/* cartão que sobe */}
      <div
        aria-hidden
        className={`absolute inset-x-5 bottom-3 z-10 h-[190px] rounded-[6px] bg-paper ${ease} ${
          opened ? "-translate-y-[110px] delay-300" : ""
        }`}
        style={{ border: `1px solid ${GOLD}` }}
      >
        <div className="flex h-full items-center justify-center px-5 text-center font-display text-[20px] font-semibold leading-tight">
          {title}
        </div>
      </div>
      {/* bolso */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[220px] rounded-[10px]"
        style={{
          clipPath: "polygon(0 0, 50% 54%, 100% 0, 100% 100%, 0 100%)",
          background: `linear-gradient(180deg, color-mix(in srgb, ${CHARCOAL} 80%, white), ${CHARCOAL})`,
        }}
      />
      {/* aba */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-[100px] h-[120px] origin-top ${ease} ${
          opened ? "z-[5] delay-150" : "z-30"
        }`}
        style={{ transform: opened ? "rotateX(180deg)" : "rotateX(0)", transformStyle: "preserve-3d" }}
      >
        <div
          className="h-full w-full"
          style={{
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            background: `linear-gradient(180deg, color-mix(in srgb, ${CHARCOAL} 70%, white), ${CHARCOAL})`,
          }}
        />
      </div>
      {/* selo */}
      <button
        type="button"
        aria-label="Abrir o convite. Segure ou toque no selo"
        disabled={opened}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onClick={open}
        className={`absolute bottom-[84px] left-1/2 z-40 h-[88px] w-[88px] -translate-x-1/2 touch-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${ease} ${
          opened ? "pointer-events-none scale-75 opacity-0" : "cursor-pointer"
        }`}
      >
        <span
          className="absolute inset-[10px] rounded-full"
          style={{
            background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${GOLD} 55%, white), ${GOLD} 55%, var(--accent-strong))`,
            boxShadow: "0 6px 16px rgba(0,0,0,0.4), inset 0 0 0 3px rgba(0,0,0,0.18)",
          }}
        />
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING}
            strokeDashoffset={holding ? 0 : RING}
            style={{ transition: holding ? `stroke-dashoffset ${HOLD_MS}ms linear` : "none" }}
          />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Balão — um toque                                                    */
/* ------------------------------------------------------------------ */

const SHARD_COLORS = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#ff924c"];

function Balloon({ onOpen }: OpeningProps) {
  const [popped, setPopped] = useState(false);
  const trigger = useTrigger(onOpen, 900);

  return (
    <div className="relative flex h-[340px] w-[260px] items-center justify-center">
      {!popped && (
        <button
          type="button"
          aria-label="Estourar o balão para abrir o convite"
          onClick={() => trigger() && setPopped(true)}
          className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent"
          style={{ animation: "invite-float 3s ease-in-out infinite" }}
        >
          <svg viewBox="0 0 120 170" width="190" height="270" aria-hidden>
            <path
              d="M60 6C30 6 10 30 10 60c0 32 26 56 50 70 24-14 50-38 50-70C110 30 90 6 60 6Z"
              fill={GOLD}
            />
            <path d="M60 130l-7 12h14z" fill="var(--accent-strong)" />
            <path d="M60 142c-6 8 6 14 0 24" stroke="var(--ink-faint, #888)" strokeWidth="1.5" fill="none" />
            <ellipse cx="38" cy="42" rx="9" ry="16" fill="white" opacity="0.35" transform="rotate(20 38 42)" />
          </svg>
        </button>
      )}
      {popped &&
        Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2;
          const d = 90 + (i % 3) * 30;
          return (
            <span
              key={i}
              aria-hidden
              className="absolute left-1/2 top-[42%] h-3 w-3 rounded-full"
              style={
                {
                  background: SHARD_COLORS[i % SHARD_COLORS.length],
                  "--dx": `${Math.cos(a) * d}px`,
                  "--dy": `${Math.sin(a) * d}px`,
                  animation: "invite-shard 800ms cubic-bezier(.2,.7,.3,1) forwards",
                } as React.CSSProperties
              }
            />
          );
        })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Velinhas — deslizar o dedo (ou soprar, se o convidado permitir)     */
/* ------------------------------------------------------------------ */

const MAX_CANDLES = 12;

function Candles({ onOpen, age }: OpeningProps) {
  const count = Math.min(age ?? 5, MAX_CANDLES);
  const [out, setOut] = useState<boolean[]>(() => Array(count).fill(false));
  const [micState, setMicState] = useState<"idle" | "listening">("idle");
  const trigger = useTrigger(onOpen, 900);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stopMic = useRef<(() => void) | null>(null);

  const extinguish = useCallback(
    (indices: number[]) => {
      setOut((prev) => {
        const next = prev.slice();
        indices.forEach((i) => (next[i] = true));
        if (next.every(Boolean)) trigger();
        return next;
      });
    },
    [trigger],
  );

  const blowAll = useCallback(() => {
    extinguish(Array.from({ length: count }, (_, i) => i));
  }, [count, extinguish]);

  useEffect(() => () => stopMic.current?.(), []);

  function onMove(e: React.PointerEvent) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const hit: number[] = [];
    wrap.querySelectorAll<HTMLElement>("[data-candle]").forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (
        e.clientX >= r.left - 14 &&
        e.clientX <= r.right + 14 &&
        e.clientY >= r.top - 30 &&
        e.clientY <= r.bottom
      ) {
        hit.push(i);
      }
    });
    if (hit.length) extinguish(hit);
  }

  // Opcional: só pede o microfone se o convidado escolher soprar.
  async function listen() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let raf = 0;
      let loud = 0;
      const stop = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
      };
      stopMic.current = stop;
      setMicState("listening");
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
        loud = peak > 60 ? loud + 1 : 0;
        if (loud > 4) {
          stop();
          blowAll();
          return;
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setMicState("idle"); // negou ou sem microfone: o deslize continua valendo
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div
        ref={wrapRef}
        onPointerMove={onMove}
        onPointerDown={onMove}
        className="relative flex h-[250px] w-[min(340px,88vw)] touch-none flex-col items-center justify-end"
      >
        <div className="absolute bottom-[96px] flex gap-3">
          {out.map((isOut, i) => (
            <div key={i} data-candle className="relative flex h-[58px] w-3 flex-col items-center justify-end">
              {!isOut ? (
                <span
                  aria-hidden
                  className="mb-0.5 block h-4 w-2.5 rounded-[50%_50%_50%_50%/60%_60%_40%_40%]"
                  style={{
                    background: "radial-gradient(circle at 50% 70%, #fff4b0, #ffb703 60%, #fb8500)",
                    boxShadow: "0 0 14px 4px rgba(255,183,3,0.55)",
                    animation: "invite-flame 0.6s ease-in-out infinite alternate",
                  }}
                />
              ) : (
                <span
                  aria-hidden
                  className="mb-1 block h-5 w-1.5 rounded-full bg-black/25"
                  style={{ animation: "invite-smoke 900ms ease-out forwards" }}
                />
              )}
              <span className="block h-9 w-2.5 rounded-sm" style={{ background: i % 2 ? "#8ecae6" : "#ffb3c1" }} />
            </div>
          ))}
        </div>
        {/* bolo */}
        <div className="h-[44px] w-full rounded-t-[14px]" style={{ background: "var(--accent-soft)" }} />
        <div className="h-[56px] w-full" style={{ background: "#f6d7c3" }} />
        <div className="h-[8px] w-[110%] rounded-full bg-black/10" />
      </div>
      {micState === "idle" && (
        <button
          type="button"
          onClick={listen}
          className="mt-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-accent-strong underline-offset-4 hover:underline"
        >
          Soprar no microfone
        </button>
      )}
      <button
        type="button"
        onClick={blowAll}
        className="sr-only focus:not-sr-only focus:mt-3 focus:text-[13px] focus:underline"
      >
        Apagar todas as velas
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Caixa de presente — puxar o laço (ou tocar)                         */
/* ------------------------------------------------------------------ */

function Gift({ onOpen }: OpeningProps) {
  const [opened, setOpened] = useState(false);
  const trigger = useTrigger(onOpen, 1200);
  const startY = useRef<number | null>(null);

  const open = () => trigger() && setOpened(true);

  return (
    <div className="relative h-[280px] w-[240px]">
      {/* tampa */}
      <div
        className="absolute left-[-8px] right-[-8px] top-[60px] z-20 h-[56px] rounded-[8px] transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
        style={{
          background: GOLD,
          transform: opened ? "translateY(-90px) rotate(-14deg)" : "none",
          opacity: opened ? 0 : 1,
        }}
      >
        <span className="absolute inset-y-0 left-1/2 w-9 -translate-x-1/2 bg-white/35" />
      </div>
      {/* caixa */}
      <div
        className="absolute inset-x-0 bottom-0 top-[110px] rounded-b-[10px]"
        style={{ background: "color-mix(in srgb, var(--accent) 80%, black)" }}
      >
        <span className="absolute inset-y-0 left-1/2 w-9 -translate-x-1/2 bg-white/30" />
      </div>
      {/* laço */}
      <button
        type="button"
        aria-label="Puxar o laço para abrir o convite"
        disabled={opened}
        onClick={open}
        onPointerDown={(e) => {
          startY.current = e.clientY;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (startY.current !== null && Math.abs(e.clientY - startY.current) > 36) open();
        }}
        onPointerUp={() => (startY.current = null)}
        className={`absolute left-1/2 top-[22px] z-30 flex h-[56px] w-[96px] -translate-x-1/2 touch-none items-center justify-center transition-all duration-500 motion-reduce:transition-none ${
          opened ? "pointer-events-none -translate-y-6 scale-50 opacity-0" : "cursor-grab"
        }`}
      >
        <svg viewBox="0 0 96 56" width="96" height="56" aria-hidden>
          <ellipse cx="26" cy="26" rx="24" ry="18" fill="var(--accent-strong)" />
          <ellipse cx="70" cy="26" rx="24" ry="18" fill="var(--accent-strong)" />
          <circle cx="48" cy="28" r="9" fill={GOLD} />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Raspadinha — arrastar o dedo                                        */
/* ------------------------------------------------------------------ */

const SCRATCH_THRESHOLD = 0.5;

function Scratch({ onOpen, dateLabel }: OpeningProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cleared, setCleared] = useState(false);
  const trigger = useTrigger(onOpen, 1100);
  const drawing = useRef(false);
  const moves = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, "#c9ccd1");
    g.addColorStop(0.5, "#eceef1");
    g.addColorStop(1, "#b4b8bf");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#6b7280";
    ctx.font = "600 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Raspe para descobrir a data", c.width / 2, c.height / 2 + 7);
  }, []);

  const finish = useCallback(() => {
    setCleared(true);
    trigger();
  }, [trigger]);

  function scratch(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || cleared) return;
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width;
    const y = ((e.clientY - r.top) / r.height) * c.height;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();

    // mede a área raspada a cada poucos movimentos (amostra a cada 8 px)
    if (++moves.current % 6 !== 0) return;
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 64) {
      total++;
      if (data[i] === 0) clear++;
    }
    if (clear / total >= SCRATCH_THRESHOLD) finish();
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[180px] w-[min(340px,88vw)] overflow-hidden rounded-[14px] bg-paper shadow-[0_20px_50px_rgba(0,0,0,0.25)]" style={{ border: `1px solid ${GOLD}` }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="mb-1 text-[11px] uppercase tracking-[0.3em] text-ink-faint">Salve a data</span>
          <span className="font-display text-[24px] font-semibold leading-tight">{dateLabel}</span>
        </div>
        <canvas
          ref={canvasRef}
          width={340}
          height={180}
          aria-hidden
          onPointerDown={(e) => {
            drawing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            scratch(e);
          }}
          onPointerMove={scratch}
          onPointerUp={() => (drawing.current = false)}
          onPointerCancel={() => (drawing.current = false)}
          className={`absolute inset-0 h-full w-full touch-none transition-opacity duration-500 ${
            cleared ? "opacity-0" : "cursor-crosshair"
          }`}
        />
      </div>
      <button
        type="button"
        onClick={finish}
        className="mt-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-accent-strong underline-offset-4 hover:underline"
      >
        Revelar a data
      </button>
    </div>
  );
}

export const OPENINGS: Record<
  OpeningId,
  { Component: (p: OpeningProps) => React.ReactElement; hint: string }
> = {
  envelope: { Component: Envelope, hint: "Segure o selo" },
  balloon: { Component: Balloon, hint: "Toque no balão" },
  candles: { Component: Candles, hint: "Sopre as velinhas" },
  gift: { Component: Gift, hint: "Puxe o laço" },
  scratch: { Component: Scratch, hint: "Raspe com o dedo" },
};
