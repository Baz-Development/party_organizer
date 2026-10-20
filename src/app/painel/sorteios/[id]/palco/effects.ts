/**
 * Efeitos do palco: som sintetizado (Web Audio, sem arquivo para carregar)
 * e chuva de confete dourado em canvas.
 */

/* ------------------------------------------------------------------ */
/* Som                                                                 */
/* ------------------------------------------------------------------ */

/**
 * O `AudioContext` só nasce no primeiro gesto da anfitriã (navegadores
 * bloqueiam áudio antes disso) — por isso `unlock()` é chamado nos cliques.
 */
export class StageSound {
  private ctx: AudioContext | null = null;
  muted = false;

  unlock() {
    if (this.ctx || typeof window === "undefined") return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
  }

  private live(): AudioContext | null {
    if (this.muted || !this.ctx) return null;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Clique curto da urna passando um nome — o "tic-tic" que cria suspense. */
  tick(speed: number) {
    const ctx = this.live();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    // Mais lento = mais grave: a urna "pesa" quando está quase parando.
    osc.frequency.value = 900 + Math.min(speed, 30) * 32 + Math.random() * 60;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /** Rufar curto de expectativa antes da urna disparar. */
  roll(durationSec: number) {
    const ctx = this.live();
    if (!ctx) return;
    const t = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * durationSec), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      // ruído modulado a ~22 Hz = rufar de caixa
      const env = 0.55 + 0.45 * Math.sin((i / ctx.sampleRate) * Math.PI * 2 * 22);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + durationSec * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
  }

  /** Acorde brilhante + grave encorpado na revelação. */
  fanfare() {
    const ctx = this.live();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      const start = t + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i < 2 ? "triangle" : "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 2.3);
    });
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = "sine";
    boom.frequency.setValueAtTime(150, t);
    boom.frequency.exponentialRampToValueAtTime(45, t + 0.6);
    boomGain.gain.setValueAtTime(0.4, t);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    boom.connect(boomGain).connect(ctx.destination);
    boom.start(t);
    boom.stop(t + 0.9);
  }
}

/* ------------------------------------------------------------------ */
/* Confete                                                             */
/* ------------------------------------------------------------------ */

/**
 * Dois canhões de confete dourado saindo dos cantos de baixo. Cada pedaço
 * gira em 3D (a largura varia com o cosseno do giro), o que dá o brilho de
 * papel metalizado virando. Canvas acima do palco, sem capturar clique.
 */
export function fireStageConfetti(colors: string[], durationMs = 4200): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return () => {};

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
    zIndex: "1200",
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return () => {};
  }
  ctx.scale(dpr, dpr);

  const count = Math.round(Math.min(260, (w * h) / 6500));
  const parts = Array.from({ length: count }, (_, i) => {
    const left = i % 2 === 0;
    const angle = (left ? -Math.PI / 3 : (-2 * Math.PI) / 3) + (Math.random() - 0.5) * 0.7;
    const speed = 11 + Math.random() * 13;
    return {
      x: left ? -10 : w + 10,
      y: h * 0.92,
      vx: Math.cos(angle) * speed * (w / 1400 + 0.5),
      vy: Math.sin(angle) * speed * (h / 900 + 0.4),
      size: 7 + Math.random() * 8,
      spin: Math.random() * Math.PI * 2,
      vSpin: 0.08 + Math.random() * 0.22,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.12,
      sway: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 260,
    };
  });

  let raf = 0;
  const t0 = performance.now();

  const frame = (now: number) => {
    const elapsed = now - t0;
    ctx.clearRect(0, 0, w, h);
    const fade = elapsed > durationMs * 0.7 ? Math.max(0, 1 - (elapsed - durationMs * 0.7) / (durationMs * 0.3)) : 1;
    for (const p of parts) {
      if (elapsed < p.delay) continue;
      p.vx *= 0.986;
      p.vy = p.vy * 0.986 + 0.24;
      p.sway += 0.05;
      p.x += p.vx + Math.sin(p.sway) * 0.6;
      p.y += p.vy;
      p.spin += p.vSpin;
      p.rot += p.vr;
      const flip = Math.cos(p.spin);
      ctx.save();
      ctx.globalAlpha = fade * (0.65 + 0.35 * Math.abs(flip));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(flip, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (elapsed < durationMs) raf = requestAnimationFrame(frame);
    else canvas.remove();
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    canvas.remove();
  };
}
