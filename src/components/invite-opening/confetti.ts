import type { ConfettiStyle } from "./pick";

const PALETTES: Record<ConfettiStyle, { colors: string[]; count: number; shape: "rect" | "petal" }> = {
  festivo: {
    colors: ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#ff924c"],
    count: 140,
    shape: "rect",
  },
  "rose-dourado": {
    colors: ["#f4b6c2", "#e88ea4", "#d4a72c", "#e6c875", "#fff4e0"],
    count: 90,
    shape: "rect",
  },
  petalas: {
    colors: ["#d4a72c", "#e6c875", "#ffffff", "#f5f3ee"],
    count: 36,
    shape: "petal",
  },
  discreto: {
    colors: ["#d4a72c", "#e6c875"],
    count: 24,
    shape: "rect",
  },
};

/**
 * Confete curto (~1,5 s) em um canvas que não captura toque. Devolve a função
 * de cancelamento; o canvas some sozinho ao fim.
 */
export function fireConfetti(style: ConfettiStyle, durationMs = 1500): () => void {
  const { colors, count, shape } = PALETTES[style];
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "110",
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return () => {};
  }
  ctx.scale(dpr, dpr);

  const originX = w / 2;
  const originY = h * 0.55;
  const parts = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = (shape === "petal" ? 5 : 9) + Math.random() * (shape === "petal" ? 4 : 9);
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: shape === "petal" ? 7 + Math.random() * 5 : 6 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });

  let raf = 0;
  const t0 = performance.now();
  const gravity = shape === "petal" ? 0.12 : 0.3;
  const drag = 0.985;

  const tick = (now: number) => {
    const elapsed = now - t0;
    ctx.clearRect(0, 0, w, h);
    // o último terço da duração é fade-out
    const fade = elapsed > durationMs * 0.65 ? Math.max(0, 1 - (elapsed - durationMs * 0.65) / (durationMs * 0.35)) : 1;
    for (const p of parts) {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (shape === "petal") {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size / 2, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
    if (elapsed < durationMs) raf = requestAnimationFrame(tick);
    else canvas.remove();
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    canvas.remove();
  };
}
