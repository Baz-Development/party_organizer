"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { nextSlot, remainingPool, totalSlots, type RaffleSlot } from "@/lib/raffle-slots";
import { themeVars } from "@/lib/themes";
import type { EventSummary, Raffle, RafflePrize, RaffleResult } from "@/lib/types";
import { fireStageConfetti, StageSound } from "./effects";
import { NameDrum, type DrumTarget } from "./NameDrum";

/**
 * Palco do sorteio — a tela que a anfitriã projeta ou compartilha.
 *
 * Feito para não precisar de treinamento: em cada momento existe UM botão
 * grande com a próxima ação (Começar → Sortear → Próximo), que também
 * responde à barra de espaço. Os controles secundários (som, tela cheia,
 * sair) ficam discretos no canto.
 *
 * O vencedor é sorteado pelo servidor ANTES da animação; a urna só anima até
 * o nome que já veio decidido. Recarregar a página no meio não perde nada.
 */

type StageEvent = Pick<
  EventSummary,
  "slug" | "title" | "hosts" | "themeKey" | "accentColor" | "accentTextColor"
>;

type Phase =
  | "carregando"
  | "erro"
  | "abertura"
  | "pronto"
  | "preparando"
  | "girando"
  | "revelado"
  | "final";

interface Draw {
  resultId: string;
  participantId: string;
  name: string;
  prizeId?: string;
  sequence: number;
  remaining: number;
}

/** Suspense mínimo entre o clique e a urna disparar (o "rufar"). */
const ANTICIPATION_MS = 1100;
/** Pausa dramática entre a urna parar e o cartão do vencedor surgir. */
const REVEAL_DELAY_MS = 700;
/** Trava da barra de espaço logo após a revelação — evita pular o momento. */
const REVEAL_GUARD_MS = 1800;

/* Preferência de som — conveniência local; localStorage pode não existir
   (aba anônima, bloqueio), então cai para memória. */
const MUTE_KEY = "palco:mudo";
let mutedInMemory = false;
const muteListeners = new Set<() => void>();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return mutedInMemory;
  }
}

function writeMuted(value: boolean) {
  mutedInMemory = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {}
  muteListeners.forEach((l) => l());
}

function subscribeMuted(listener: () => void) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Vaga do nome que acabou de sair (ainda não está em `raffle.results`). */
function slotFor(raffle: Raffle, prizeId: string | undefined): RaffleSlot {
  const unit =
    raffle.results.filter((r) => r.status === "valido" && r.prizeId === prizeId).length + 1;
  const prize = prizeId ? raffle.prizes.find((p) => p.id === prizeId) : undefined;
  return prize ? { kind: "premio", prize, unit } : { kind: "suplente", unit };
}

export function RaffleStage({ event, raffleId }: { event: StageEvent; raffleId: string }) {
  const base = `/api/eventos/${event.slug}/sorteios/${raffleId}`;
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [phase, setPhase] = useState<Phase>("carregando");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [current, setCurrent] = useState<{ draw: Draw; slot: RaffleSlot } | null>(null);
  const [target, setTarget] = useState<DrumTarget | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const muted = useSyncExternalStore(subscribeMuted, readMuted, () => false);
  const [fullscreen, setFullscreen] = useState(false);
  const [busy, setBusy] = useState(false);
  const soundRef = useRef<StageSound | null>(null);
  /** Instância única, criada na primeira vez que alguém precisa de som. */
  const sound = useCallback(() => (soundRef.current ??= new StageSound()), []);
  const revealedAt = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const phaseFor = (r: Raffle): Phase =>
    r.status === "aberto" ? "abertura" : r.status === "encerrado" ? "final" : "pronto";

  const load = useCallback(async () => {
    const res = await fetch(base);
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setLoadError(body?.error ?? "Não foi possível carregar o sorteio.");
      setPhase("erro");
      return;
    }
    const r = body.data as Raffle;
    setRaffle(r);
    setPhase(phaseFor(r));
  }, [base]);

  useEffect(() => {
    let cancelled = false;
    fetch(base)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(body?.error ?? "Não foi possível carregar o sorteio.");
          setPhase("erro");
          return;
        }
        const r = body.data as Raffle;
        setRaffle(r);
        setPhase(phaseFor(r));
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError("Sem conexão com o servidor.");
        setPhase("erro");
      });
    return () => {
      cancelled = true;
    };
  }, [base]);

  useEffect(() => {
    sound().muted = muted;
  }, [muted, sound]);

  // O palco cobre a tela: sem rolagem da página de trás.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleMute = useCallback(() => writeMuted(!readMuted()), []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  /* ---------------- Ações ---------------- */

  const start = useCallback(async () => {
    if (!raffle || busy) return;
    sound().unlock();
    setBusy(true);
    const res = await fetch(`${base}/estado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "iniciar" }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setBusy(false);
      setToast(body?.error ?? "Não foi possível começar o sorteio.");
      return;
    }
    // Recarrega: nos modos "todos"/"confirmados" a urna acabou de ser montada
    // pelo banco a partir da lista de convidados.
    await load();
    setBusy(false);
  }, [raffle, busy, base, sound, load]);

  const draw = useCallback(async () => {
    if (!raffle || phase !== "pronto") return;
    sound().unlock();
    setPhase("preparando");
    sound().roll(ANTICIPATION_MS / 1000);

    const [res] = await Promise.all([
      fetch(`${base}/sortear`, { method: "POST" }).catch(() => null),
      wait(ANTICIPATION_MS),
    ]);
    const body = res ? await res.json().catch(() => null) : null;

    if (!res || !res.ok) {
      if (body?.code === "sorteio_concluido" || body?.code === "participantes_esgotados") {
        await load();
      } else {
        setToast(body?.error ?? "Não foi possível sortear. Verifique a conexão e tente de novo.");
        setPhase("pronto");
      }
      return;
    }

    const d = body.data as Draw;
    setCurrent({ draw: d, slot: slotFor(raffle, d.prizeId) });
    setTarget({ key: d.resultId, name: d.name });
    setPhase("girando");
  }, [raffle, phase, base, sound, load]);

  const onSettled = useCallback(() => {
    setTimeout(() => {
      setRaffle((r) => {
        if (!r || !current) return r;
        const result: RaffleResult = {
          id: current.draw.resultId,
          participantId: current.draw.participantId,
          name: current.draw.name,
          prizeId: current.draw.prizeId,
          sequence: current.draw.sequence,
          status: "valido",
          drawnAt: new Date().toISOString(),
        };
        return {
          ...r,
          results: [...r.results, result],
          drawnCount: r.drawnCount + 1,
          status: current.draw.remaining === 0 ? "encerrado" : "em_andamento",
        };
      });
      revealedAt.current = Date.now();
      setPhase("revelado");
      sound().fanfare();
      const styles = rootRef.current ? getComputedStyle(rootRef.current) : null;
      fireStageConfetti([
        styles?.getPropertyValue("--accent").trim() || "#d4a72c",
        styles?.getPropertyValue("--accent-soft").trim() || "#e6c875",
        "#f2c94c",
        "#fff8e6",
        "#d9d9d9",
      ]);
    }, REVEAL_DELAY_MS);
  }, [current, sound]);

  const next = useCallback(() => {
    if (phase !== "revelado" || !raffle) return;
    setTarget(null);
    setCurrent(null);
    const done = raffle.status === "encerrado" || !nextSlot(raffle);
    setPhase(done ? "final" : "pronto");
  }, [phase, raffle]);

  const markAbsent = useCallback(async () => {
    if (!current || !raffle || busy) return;
    if (!confirm(`${current.draw.name} não está presente? O nome sai da urna e este prêmio é sorteado de novo.`))
      return;
    setBusy(true);
    const res = await fetch(`${base}/resultados/${current.draw.resultId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ausente" }),
    });
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setToast(body?.error ?? "Não foi possível marcar como ausente.");
      return;
    }
    setRaffle({
      ...raffle,
      status: "em_andamento",
      drawnCount: raffle.drawnCount - 1,
      results: raffle.results.map((r) =>
        r.id === current.draw.resultId ? { ...r, status: "ausente" } : r,
      ),
    });
    setTarget(null);
    setCurrent(null);
    setPhase("pronto");
  }, [current, raffle, busy, base]);

  const finish = useCallback(async () => {
    if (!raffle || busy) return;
    setBusy(true);
    const res = await fetch(`${base}/estado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "encerrar" }),
    });
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setToast(body?.error ?? "Não foi possível encerrar.");
      return;
    }
    setRaffle({ ...raffle, status: "encerrado" });
    setPhase("final");
  }, [raffle, busy, base]);

  /* ---------------- Derivados ---------------- */

  const pool = useMemo(() => (raffle ? remainingPool(raffle) : []), [raffle]);
  const poolNames = useMemo(() => pool.map((p) => p.name), [pool]);
  const slot = raffle ? nextSlot(raffle) : null;
  const exhausted = phase === "pronto" && !!slot && pool.length === 0;

  // Um botão por momento — e a barra de espaço faz a mesma coisa.
  const primary = useMemo((): { label: string; run: () => void } | null => {
    if (phase === "abertura") return { label: "Começar o sorteio", run: start };
    if (phase === "pronto") {
      if (!slot) return { label: "Ver ganhadores", run: () => setPhase("final") };
      if (exhausted) return { label: "Encerrar sorteio", run: finish };
      return { label: "Sortear", run: draw };
    }
    if (phase === "revelado") {
      const done = raffle?.status === "encerrado" || (raffle && !nextSlot(raffle));
      return { label: done ? "Ver todos os ganhadores" : "Próximo sorteio", run: next };
    }
    return null;
  }, [phase, slot, exhausted, raffle, start, finish, draw, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["BUTTON", "INPUT", "TEXTAREA", "A"].includes(el.tagName)) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (phase === "revelado" && Date.now() - revealedAt.current < REVEAL_GUARD_MS) return;
        primary?.run();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [primary, phase, toggleFullscreen, toggleMute]);

  /* ---------------- Render ---------------- */

  const total = raffle ? totalSlots(raffle) : 0;
  const drawnValid = raffle ? raffle.results.filter((r) => r.status === "valido").length : 0;

  return (
    <div
      ref={rootRef}
      style={themeVars(event)}
      className="stage-bg fixed inset-0 z-[1000] overflow-hidden text-[#f5f3ee]"
    >
      <StageAtmosphere intense={phase === "girando" || phase === "preparando"} />

      {/* Barra superior discreta ----------------------------------- */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="hidden min-w-0 text-[12px] uppercase tracking-[3px] text-[color-mix(in_srgb,var(--accent-soft)_80%,transparent)] sm:block">
          <span className="truncate">{event.title}</span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 opacity-60 transition hover:opacity-100">
          <StageIconButton label={muted ? "Ligar som (M)" : "Desligar som (M)"} onClick={toggleMute}>
            {muted ? <IconMuted /> : <IconSound />}
          </StageIconButton>
          <StageIconButton
            label={fullscreen ? "Sair da tela cheia (F)" : "Tela cheia (F)"}
            onClick={toggleFullscreen}
          >
            <IconFullscreen exit={fullscreen} />
          </StageIconButton>
          <Link
            href={`/painel/sorteios/${raffleId}`}
            className="ml-1 rounded-full border border-white/15 px-4 py-2 text-[13px] font-semibold text-white/80 no-underline hover:bg-white/10"
          >
            Sair
          </Link>
        </div>
      </div>

      {/* Conteúdo ---------------------------------------------------- */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center px-5 pb-6 pt-20 sm:px-8 sm:pt-16">
        {phase === "carregando" && (
          <p className="stage-rise font-display text-[22px] text-white/60">Preparando o palco…</p>
        )}

        {phase === "erro" && (
          <div className="stage-rise text-center">
            <p className="font-display text-[26px]">{loadError}</p>
            <Link
              href={`/painel/sorteios/${raffleId}`}
              className="mt-6 inline-block rounded-full border border-white/20 px-6 py-3 text-white no-underline"
            >
              Voltar ao painel
            </Link>
          </div>
        )}

        {raffle && phase === "abertura" && <Opening raffle={raffle} hosts={event.hosts} />}

        {raffle && ["pronto", "preparando", "girando", "revelado"].includes(phase) && (
          <div className="flex w-full max-w-[1320px] flex-1 flex-col items-center justify-center gap-[3vh]">
            <div className="stage-rise text-center">
              <h1 className="stage-shimmer font-display text-[clamp(26px,4.2vw,54px)] font-semibold leading-tight">
                {raffle.title}
              </h1>
              <p className="mt-2 text-[clamp(13px,1.3vw,16px)] tracking-wide text-white/55">
                {slot || current
                  ? `Sorteio ${Math.min(drawnValid + 1, total)} de ${total} · ${pool.length} ${pool.length === 1 ? "nome" : "nomes"} na urna`
                  : "Todos os prêmios foram sorteados"}
              </p>
            </div>

            <div className="grid w-full items-center gap-[4vh] lg:grid-cols-[minmax(240px,340px)_1fr] lg:gap-12">
              <div className="hidden justify-center lg:flex">
                {(current?.slot ?? slot) && <SlotCard slot={(current?.slot ?? slot)!} />}
              </div>
              <div className="relative">
                <div
                  className={`stage-gather pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-700 ${
                    phase === "preparando" || phase === "girando" ? "opacity-100" : "opacity-0"
                  }`}
                />
                <NameDrum
                  names={poolNames}
                  target={target}
                  onSettled={onSettled}
                  onTick={(speed) => sound().tick(speed)}
                />
              </div>
            </div>

            {/* Prêmio da vez no celular (o cartão 3D fica só em telas largas). */}
            {(current?.slot ?? slot) && (
              <div className="text-center lg:hidden">
                <SlotLabel slot={(current?.slot ?? slot)!} />
              </div>
            )}

            <div className="flex min-h-[110px] flex-col items-center justify-center gap-3">
              {phase === "pronto" && primary && (
                <>
                  {exhausted && (
                    <p className="text-center text-[15px] text-white/70">
                      Não há mais participantes na urna para os prêmios restantes.
                    </p>
                  )}
                  <PrimaryButton label={primary.label} onClick={primary.run} disabled={busy} />
                  <KeyHint />
                </>
              )}
              {phase === "preparando" && (
                <p className="font-display text-[clamp(20px,2.4vw,30px)] italic text-[var(--accent-soft)]">
                  Rufem os tambores…
                </p>
              )}
              {phase === "girando" && current && (
                <p className="font-display text-[clamp(20px,2.4vw,30px)] italic text-[var(--accent-soft)]">
                  {current.slot.kind === "premio"
                    ? `Sorteando: ${current.slot.prize.name}`
                    : "Sorteando suplente…"}
                </p>
              )}
            </div>

            <ProgressDots raffle={raffle} />
          </div>
        )}

        {raffle && phase === "final" && <Finale raffle={raffle} raffleId={raffleId} />}

        {phase === "abertura" && primary && (
          <div className="mt-[4vh] flex flex-col items-center gap-3">
            <PrimaryButton label={primary.label} onClick={primary.run} disabled={busy} />
            <p className="max-w-[440px] text-center text-[13px] text-white/45">
              Ao começar, a lista de participantes é bloqueada — ninguém entra ou sai da urna.
            </p>
          </div>
        )}
      </div>

      {phase === "revelado" && current && raffle && primary && (
        <Reveal
          name={current.draw.name}
          slot={current.slot}
          onPrimary={() => {
            if (Date.now() - revealedAt.current < REVEAL_GUARD_MS) return;
            primary.run();
          }}
          primaryLabel={primary.label}
          onAbsent={markAbsent}
          busy={busy}
        />
      )}

      {toast && (
        <div className="stage-rise fixed bottom-6 left-1/2 z-[1300] w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#1a1714]/95 px-5 py-4 text-center text-[14.5px] shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Atmosfera: feixes de luz e poeira dourada                           */
/* ------------------------------------------------------------------ */

// Valores fixos (não `Math.random`) para o HTML do servidor e do cliente baterem.
const MOTES = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return {
    x: `${(r(1) * 100).toFixed(2)}%`,
    s: `${(2 + r(2) * 4).toFixed(1)}px`,
    t: `${(9 + r(3) * 12).toFixed(1)}s`,
    d: `${(-r(4) * 20).toFixed(1)}s`,
    dx: `${((r(5) - 0.5) * 160).toFixed(0)}px`,
  };
});

function StageAtmosphere({ intense }: { intense: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="stage-beam"
        style={{ "--x": "18%", "--from": "-18deg", "--to": "10deg", "--t": "12s" } as React.CSSProperties}
      />
      <div
        className="stage-beam"
        style={{ "--x": "82%", "--from": "16deg", "--to": "-12deg", "--t": "10s" } as React.CSSProperties}
      />
      <div
        className={`stage-beam transition-opacity duration-1000 ${intense ? "opacity-80" : "opacity-0"}`}
        style={{ "--x": "50%", "--from": "-5deg", "--to": "5deg", "--t": "3s" } as React.CSSProperties}
      />
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="stage-mote"
          style={{ "--x": m.x, "--s": m.s, "--t": m.t, "--d": m.d, "--dx": m.dx } as React.CSSProperties}
        />
      ))}
      <div className="stage-vignette absolute inset-0" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Abertura: título e carrossel 3D dos prêmios                         */
/* ------------------------------------------------------------------ */

function Opening({ raffle, hosts }: { raffle: Raffle; hosts: string }) {
  const n = raffle.prizes.length;
  const cardW = 230;
  // Raio do anel: o necessário para os cartões não se encostarem, com um
  // mínimo para que poucos prêmios ainda formem um carrossel legível.
  const radius = Math.max(cardW * 1.05, Math.round(cardW / (2 * Math.tan(Math.PI / n)) + 50));

  return (
    <div className="flex w-full flex-col items-center text-center">
      {hosts && (
        <div className="stage-rise text-[13px] uppercase tracking-[4px] text-white/50" style={{ "--d": "0.1s" } as React.CSSProperties}>
          {hosts} apresentam
        </div>
      )}
      <h1
        className="stage-rise mt-3 font-display text-[clamp(38px,7vw,96px)] font-semibold leading-[1.05]"
        style={{ "--d": "0.25s" } as React.CSSProperties}
      >
        <span className="stage-shimmer">{raffle.title}</span>
      </h1>
      {raffle.description && (
        <p
          className="stage-rise mt-3 max-w-[720px] text-[clamp(15px,1.6vw,20px)] text-white/65"
          style={{ "--d": "0.4s" } as React.CSSProperties}
        >
          {raffle.description}
        </p>
      )}
      <div
        className="stage-rise mt-5 flex flex-wrap justify-center gap-x-10 gap-y-2 text-white/70"
        style={{ "--d": "0.55s" } as React.CSSProperties}
      >
        <Counter value={raffle.participantCount} one="participante" many="participantes" />
        <Counter value={raffle.prizes.reduce((a, p) => a + p.quantity, 0)} one="ganhador" many="ganhadores" />
        {raffle.alternatesCount > 0 && (
          <Counter value={raffle.alternatesCount} one="suplente" many="suplentes" />
        )}
      </div>

      {n > 0 && (
        <div
          className="stage-rise relative mt-[4vh] h-[290px] w-full"
          style={{ perspective: "1600px", "--d": "0.75s" } as React.CSSProperties}
        >
          <div
            className={`absolute left-1/2 top-0 h-full ${n > 1 ? "stage-carousel" : ""}`}
            style={
              {
                width: cardW,
                marginLeft: -cardW / 2,
                "--r": `${radius}px`,
                "--t": `${Math.max(14, n * 5)}s`,
              } as React.CSSProperties
            }
          >
            {raffle.prizes.map((p, i) => (
              <div
                key={p.id}
                className="absolute inset-0"
                style={{
                  transform: n > 1 ? `rotateY(${(360 / n) * i}deg) translateZ(${radius}px)` : undefined,
                  backfaceVisibility: "hidden",
                }}
              >
                <PrizeFace prize={p} order={i + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Counter({ value, one, many }: { value: number; one: string; many: string }) {
  return (
    <span className="text-[15px]">
      <strong className="font-display text-[clamp(28px,3vw,40px)] font-semibold text-[var(--accent-soft)]">
        {value}
      </strong>{" "}
      {value === 1 ? one : many}
    </span>
  );
}

function PrizeFace({ prize, order }: { prize: RafflePrize; order?: number }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--accent-soft)_45%,transparent)] bg-[linear-gradient(160deg,#221e19,#0c0b0a)] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
      <div className="relative h-[58%] overflow-hidden bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--accent)_35%,transparent),transparent_70%)]">
        {prize.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada de curta duração.
          <img src={prize.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--accent-soft)]">
            <IconGift />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(12,11,10,0.85),transparent_55%)]" />
        {order !== undefined && (
          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--accent-soft)]">
            {order}º
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center px-4 text-center">
        <div className="line-clamp-2 font-display text-[19px] font-semibold leading-tight">{prize.name}</div>
        {prize.quantity > 1 && (
          <div className="mt-1 text-[12px] uppercase tracking-[2px] text-white/50">
            {prize.quantity} ganhadores
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Prêmio da vez                                                       */
/* ------------------------------------------------------------------ */

function slotEyebrow(slot: RaffleSlot): string {
  if (slot.kind === "suplente") return `Suplente nº ${slot.unit}`;
  return slot.prize.quantity > 1 ? `Valendo · ${slot.unit} de ${slot.prize.quantity}` : "Valendo";
}

function SlotCard({ slot }: { slot: RaffleSlot }) {
  return (
    <div key={slot.kind === "premio" ? `${slot.prize.id}-${slot.unit}` : `s-${slot.unit}`} className="stage-rise w-full max-w-[320px]">
      <div className="mb-3 text-center text-[12px] uppercase tracking-[4px] text-[var(--accent-soft)]">
        {slotEyebrow(slot)}
      </div>
      <div className="stage-float3d h-[340px]">
        {slot.kind === "premio" ? (
          <PrizeFace prize={slot.prize} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-[22px] border border-[color-mix(in_srgb,var(--accent-soft)_45%,transparent)] bg-[linear-gradient(160deg,#221e19,#0c0b0a)] px-6 text-center shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <div className="font-display text-[64px] font-semibold text-[var(--accent-soft)]">{slot.unit}º</div>
            <div className="mt-2 font-display text-[22px]">Suplente</div>
            <p className="mt-2 text-[13px] text-white/55">Assume caso algum ganhador não esteja presente.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SlotLabel({ slot }: { slot: RaffleSlot }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[3px] text-[var(--accent-soft)]">{slotEyebrow(slot)}</div>
      <div className="mt-1 font-display text-[22px] font-semibold">
        {slot.kind === "premio" ? slot.prize.name : "Suplente"}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Revelação                                                           */
/* ------------------------------------------------------------------ */

function Reveal({
  name,
  slot,
  primaryLabel,
  onPrimary,
  onAbsent,
  busy,
}: {
  name: string;
  slot: RaffleSlot;
  primaryLabel: string;
  onPrimary: () => void;
  onAbsent: () => void;
  busy: boolean;
}) {
  // `slot.unit` é a posição deste vencedor no prêmio (1 = primeiro).
  const eyebrow =
    slot.kind === "suplente"
      ? `Suplente nº ${slot.unit}`
      : slot.prize.quantity > 1
        ? `Ganhador(a) ${slot.unit} de ${slot.prize.quantity}`
        : "Ganhador(a)";

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center overflow-hidden bg-black/70 px-4 backdrop-blur-md [animation:fade-up_0.5s_ease_both]">
      <div className="stage-rays pointer-events-none absolute left-1/2 top-1/2 h-[170vmax] w-[170vmax] -translate-x-1/2 -translate-y-1/2" />
      <div className="hero-glow pointer-events-none absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" />

      <div className="stage-flip-in relative w-[min(94vw,880px)] rounded-[34px] border border-[color-mix(in_srgb,var(--accent-soft)_55%,transparent)] bg-[linear-gradient(160deg,#211d18_0%,#0b0a09_70%)] px-[clamp(20px,5vw,64px)] py-[clamp(28px,6vh,64px)] text-center shadow-[0_40px_120px_rgba(0,0,0,0.75),0_0_80px_color-mix(in_srgb,var(--accent)_35%,transparent)]">
        <Corner className="left-4 top-4" />
        <Corner className="right-4 top-4 rotate-90" />
        <Corner className="bottom-4 right-4 rotate-180" />
        <Corner className="bottom-4 left-4 -rotate-90" />

        <div className="stage-rise text-[clamp(12px,1.3vw,15px)] uppercase tracking-[5px] text-[var(--accent-soft)]" style={{ "--d": "0.5s" } as React.CSSProperties}>
          {eyebrow}
        </div>
        <h2
          className="stage-rise mt-4 break-words font-display text-[clamp(40px,8vw,112px)] font-semibold leading-[1.02]"
          style={{ "--d": "0.7s" } as React.CSSProperties}
        >
          {/* Animação de entrada e brilho em elementos separados: as duas usam `animation`. */}
          <span className="stage-shimmer">{name}</span>
        </h2>

        <div className="stage-rise mx-auto my-[3vh] h-px w-40 bg-[linear-gradient(90deg,transparent,var(--accent-soft),transparent)]" style={{ "--d": "0.9s" } as React.CSSProperties} />

        {slot.kind === "premio" ? (
          <div className="stage-rise flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:text-left" style={{ "--d": "1.05s" } as React.CSSProperties}>
            <div className="h-[clamp(72px,11vh,110px)] w-[clamp(72px,11vh,110px)] shrink-0 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--accent-soft)_45%,transparent)] bg-black/40">
              {slot.prize.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL assinada de curta duração.
                <img src={slot.prize.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--accent-soft)]">
                  <IconGift small />
                </div>
              )}
            </div>
            <div>
              <div className="text-[12px] uppercase tracking-[3px] text-white/50">Leva para casa</div>
              <div className="font-display text-[clamp(22px,2.8vw,34px)] font-semibold">{slot.prize.name}</div>
              {slot.prize.description && (
                <div className="mt-0.5 text-[14px] text-white/55">{slot.prize.description}</div>
              )}
            </div>
          </div>
        ) : (
          <p className="stage-rise text-[16px] text-white/65" style={{ "--d": "1.05s" } as React.CSSProperties}>
            Assume um prêmio caso algum ganhador não esteja presente.
          </p>
        )}

        <div className="stage-rise mt-[4vh] flex flex-col items-center gap-3" style={{ "--d": "1.5s" } as React.CSSProperties}>
          <PrimaryButton label={primaryLabel} onClick={onPrimary} disabled={busy} />
          <button
            type="button"
            onClick={onAbsent}
            disabled={busy}
            className="cursor-pointer text-[13.5px] text-white/50 underline-offset-4 hover:text-white/80 hover:underline disabled:opacity-40"
          >
            Não está presente? Sortear outro nome
          </button>
        </div>
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-7 w-7 border-l-2 border-t-2 border-[color-mix(in_srgb,var(--accent-soft)_70%,transparent)] ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Final: quadro de ganhadores                                         */
/* ------------------------------------------------------------------ */

function Finale({ raffle, raffleId }: { raffle: Raffle; raffleId: string }) {
  const valid = raffle.results.filter((r) => r.status === "valido");
  const winners = raffle.prizes.flatMap((prize) =>
    valid.filter((r) => r.prizeId === prize.id).map((r) => ({ result: r, prize })),
  );
  const alternates = valid.filter((r) => !r.prizeId);

  return (
    <div className="no-scrollbar flex h-full w-full max-w-[1200px] flex-col items-center overflow-y-auto py-6 text-center">
      <div className="stage-rise text-[13px] uppercase tracking-[5px] text-[var(--accent-soft)]">
        {raffle.title}
      </div>
      <h1 className="stage-rise mt-2 font-display text-[clamp(34px,6vw,76px)] font-semibold leading-tight" style={{ "--d": "0.15s" } as React.CSSProperties}>
        <span className="stage-shimmer">
          {winners.length > 0 ? "Parabéns aos ganhadores!" : "Sorteio encerrado"}
        </span>
      </h1>

      <div className="mt-[5vh] grid w-full gap-5 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
        {winners.map(({ result, prize }, i) => (
          <div
            key={result.id}
            className="stage-flip-in rounded-[22px] border border-[color-mix(in_srgb,var(--accent-soft)_40%,transparent)] bg-[linear-gradient(160deg,#211d18,#0c0b0a)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
            style={{ animationDelay: `${0.3 + i * 0.14}s` }}
          >
            <div className="flex items-center gap-3 text-left">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/40">
                {prize.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL assinada de curta duração.
                  <img src={prize.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--accent-soft)]">
                    <IconGift small />
                  </div>
                )}
              </div>
              <div className="min-w-0 text-[12.5px] uppercase tracking-[2px] text-white/55">
                <span className="line-clamp-2">{prize.name}</span>
              </div>
            </div>
            <div className="mt-4 break-words font-display text-[clamp(22px,2.4vw,30px)] font-semibold text-[var(--accent-soft)]">
              {result.name}
            </div>
          </div>
        ))}
      </div>

      {alternates.length > 0 && (
        <div className="stage-rise mt-[5vh]" style={{ "--d": `${0.4 + winners.length * 0.14}s` } as React.CSSProperties}>
          <div className="text-[12px] uppercase tracking-[4px] text-white/50">Suplentes</div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1 font-display text-[20px]">
            {alternates.map((r, i) => (
              <span key={r.id}>
                <span className="text-[var(--accent-soft)]">{i + 1}º</span> {r.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/painel/sorteios/${raffleId}`}
        className="stage-rise mt-[6vh] rounded-full border border-white/20 px-7 py-3 text-[14px] font-semibold text-white no-underline hover:bg-white/10"
        style={{ "--d": `${0.6 + winners.length * 0.14}s` } as React.CSSProperties}
      >
        Voltar ao painel
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Peças pequenas                                                      */
/* ------------------------------------------------------------------ */

function ProgressDots({ raffle }: { raffle: Raffle }) {
  const total = totalSlots(raffle);
  const filled = raffle.results.filter((r) => r.status === "valido").length;
  if (total === 0 || total > 60) return null;
  return (
    <div className="flex flex-wrap justify-center gap-1.5" aria-label={`${filled} de ${total} sorteados`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full transition-all duration-700 ${
            i < filled
              ? "bg-[var(--accent-soft)] shadow-[0_0_10px_var(--accent-soft)]"
              : "bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

function PrimaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      autoFocus
      className="stage-halo btn-sheen cursor-pointer rounded-full bg-[linear-gradient(180deg,var(--accent-soft),var(--accent)_55%,var(--accent-strong))] px-[clamp(36px,5vw,64px)] py-[clamp(14px,2vh,22px)] font-display text-[clamp(18px,2vw,26px)] font-semibold tracking-wide text-[var(--on-accent)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
    >
      {label}
    </button>
  );
}

function KeyHint() {
  return (
    <p className="hidden text-[12.5px] text-white/40 sm:block">
      ou pressione{" "}
      <kbd className="rounded-md border border-white/20 px-2 py-0.5 font-sans text-[11.5px]">espaço</kbd>
    </p>
  );
}

function StageIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white/80 transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function IconSound() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function IconMuted() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </svg>
  );
}

function IconFullscreen({ exit }: { exit: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {exit ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      ) : (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      )}
    </svg>
  );
}

function IconGift({ small }: { small?: boolean }) {
  const size = small ? 34 : 72;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}
