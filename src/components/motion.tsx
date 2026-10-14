"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Primitivas de movimento da landing — sem lib, só IntersectionObserver +
 * CSS (`.reveal` em globals.css). Tudo dispara uma única vez e respeita
 * `prefers-reduced-motion`.
 */

/** `true` assim que o elemento entra na tela (e nunca volta a `false`). */
export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, on] as const;
}

/** Surge de baixo para cima quando entra na tela; `delay` em ms para escalonar. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, on] = useInView<HTMLDivElement>(0.12);

  return (
    <div
      ref={ref}
      className={`reveal ${on ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Número que sobe de 0 até `to` com desaceleração, quando `on` vira `true`. */
export function CountUp({
  to,
  on,
  duration = 1800,
}: {
  to: number;
  on: boolean;
  duration?: number;
}) {
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!on) return;
    // com movimento reduzido, pula direto para o valor final no 1º frame
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = ms === 0 ? 1 : Math.min((t - t0) / ms, 1);
      setV(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, to, duration]);

  return <>{v.toLocaleString("pt-BR")}</>;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Inclinação 3D que segue o ponteiro (mouse/caneta) + brilho de vidro.
 * Escreve direto no DOM (sem re-render). `className` vai no contêiner externo;
 * `innerClassName` no elemento que gira (use-o para o raio das bordas, para o
 * brilho ser recortado igual ao cartão). Filhos com `translateZ` saem do plano.
 */
export function Tilt({
  children,
  max = 8,
  glare = true,
  className = "",
  innerClassName = "",
}: {
  children: ReactNode;
  max?: number;
  glare?: boolean;
  className?: string;
  innerClassName?: string;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const shine = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || prefersReducedMotion()) return;
    const el = outer.current;
    const box = inner.current;
    if (!el || !box) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    box.style.transition = "transform 0.12s ease-out";
    box.style.transform = `rotateX(${((0.5 - py) * 2 * max).toFixed(2)}deg) rotateY(${((px - 0.5) * 2 * max).toFixed(2)}deg)`;
    const s = shine.current;
    if (s) {
      s.style.opacity = "1";
      s.style.background = `radial-gradient(circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(255,255,255,0.38), transparent 55%)`;
    }
  };

  const leave = () => {
    const box = inner.current;
    if (box) {
      box.style.transition = "transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1)";
      box.style.transform = "rotateX(0deg) rotateY(0deg)";
    }
    if (shine.current) shine.current.style.opacity = "0";
  };

  return (
    <div
      ref={outer}
      className={className}
      style={{ perspective: "900px" }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <div
        ref={inner}
        className={`relative h-full w-full ${innerClassName}`}
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {children}
        {glare && (
          <div
            ref={shine}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
            style={{ mixBlendMode: "soft-light" }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Gira o conteúdo em 3D conforme ele cruza a janela: de frente quando está no
 * centro da tela, virado para os lados quando entra/sai.
 */
export function ScrollRotate({
  children,
  tilt = 10,
  className = "",
}: {
  children: ReactNode;
  tilt?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const half = window.innerHeight / 2;
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - half) / half));
      el.style.transform = `perspective(1100px) rotateX(${(p * tilt * 0.6).toFixed(2)}deg) rotateY(${(-p * tilt * 1.4).toFixed(2)}deg)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tilt]);

  return (
    <div ref={ref} className={className} style={{ transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}
