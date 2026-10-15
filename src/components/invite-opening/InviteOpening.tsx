"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { fireConfetti } from "./confetti";
import { OPENINGS } from "./openings";
import {
  coverLine,
  parseAge,
  storageKey,
  type ConfettiStyle,
  type OpeningId,
} from "./pick";

type Phase = "checking" | "opening" | "revealing" | "done";

interface Props {
  inviteId: string;
  title: string;
  eyebrow: string;
  dateLabel: string;
  coverUrl?: string;
  opening: OpeningId;
  confetti: ConfettiStyle;
  guestName: string | null;
  /** Variáveis de tema do evento (`themeVars`), para a capa já nascer nas cores certas. */
  themeStyle: CSSProperties;
  children: ReactNode;
}

const HERO_TIMEOUT_MS = 2500;

/**
 * Abertura teatral do convite: capa, um gesto, revelação e confete, e então a
 * página. Quem já viu (ou prefere menos movimento) entra direto.
 *
 * A capa é renderizada no servidor para não piscar a página por baixo antes da
 * hidratação. A página fica `inert` enquanto a capa está ativa.
 */
export function InviteOpening({
  inviteId,
  title,
  eyebrow,
  dateLabel,
  coverUrl,
  opening,
  confetti,
  guestName,
  themeStyle,
  children,
}: Props) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [quick, setQuick] = useState(false); // fade curto (pular / movimento reduzido / já visto)
  const heroReady = useRef<Promise<void> | null>(null);
  const revealed = useRef(false);

  const remember = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey(inviteId), "1");
    } catch {
      /* armazenamento bloqueado: a abertura aparece de novo, o que é aceitável */
    }
  }, [inviteId]);

  const reveal = useCallback(
    (withConfetti: boolean) => {
      if (revealed.current) return;
      revealed.current = true;
      remember();
      setQuick(!withConfetti);
      setPhase("revealing");
      if (withConfetti) fireConfetti(confetti);
    },
    [confetti, remember],
  );

  // Decide, uma vez, se a abertura roda. Também pré-carrega o hero.
  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(storageKey(inviteId)) === "1";
    } catch {
      /* ver `remember` */
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (seen || reduced) {
      revealed.current = true;
      if (reduced) remember();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- decisão que depende do navegador (localStorage, media query); não existe no servidor.
      setQuick(true);
      setPhase("revealing");
      return;
    }

    heroReady.current = new Promise<void>((resolve) => {
      if (!coverUrl) return resolve();
      const img = new Image();
      const timer = window.setTimeout(resolve, HERO_TIMEOUT_MS);
      const done = () => {
        window.clearTimeout(timer);
        resolve();
      };
      img.onload = done;
      img.onerror = done;
      img.src = coverUrl;
    });
    setPhase("opening");
  }, [inviteId, coverUrl, remember]);

  // Termina a revelação (fade) e desmonta a capa.
  useEffect(() => {
    if (phase !== "revealing") return;
    const id = window.setTimeout(() => setPhase("done"), quick ? 350 : 800);
    return () => window.clearTimeout(id);
  }, [phase, quick]);

  // Trava a rolagem enquanto a capa está de pé.
  useEffect(() => {
    if (phase === "done" || phase === "revealing") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  // O hero precisa estar pronto antes da revelação; segura o último frame.
  const onOpen = useCallback(() => {
    void (heroReady.current ?? Promise.resolve()).then(() => reveal(true));
  }, [reveal]);

  const { Component, hint } = OPENINGS[opening];
  const blocked = phase === "checking" || phase === "opening";
  const gone = phase === "done";

  return (
    <>
      <div {...(blocked ? { inert: true } : {})}>{children}</div>

      {!gone && (
        <div
          role="dialog"
          aria-modal={blocked}
          aria-label={`Convite: ${title}`}
          data-invite-opening
          style={{
            ...themeStyle,
            opacity: phase === "revealing" ? 0 : 1,
            transform: phase === "revealing" && !quick ? "scale(1.04)" : "none",
            transition: `opacity ${quick ? 300 : 700}ms ease, transform ${quick ? 300 : 700}ms ease`,
            pointerEvents: phase === "revealing" ? "none" : "auto",
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-paper-3 px-6 text-center"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(90% 60% at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)",
            }}
          />

          <button
            type="button"
            onClick={() => reveal(false)}
            className="absolute right-4 top-4 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-soft hover:bg-paper-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            Pular
          </button>

          <div
            className="relative flex flex-col items-center transition-opacity duration-300"
            style={{ opacity: phase === "checking" ? 0 : 1 }}
          >
            <div className="mb-2 text-[12px] uppercase tracking-[0.3em] text-accent-strong">{eyebrow}</div>
            <h1 className="mb-1 font-display text-[clamp(30px,7vw,48px)] font-semibold leading-[1.1] text-ink">
              {title}
            </h1>
            <p className="mb-10 text-[15px] text-ink-soft">{coverLine(guestName)}</p>

            {phase !== "checking" && <Component onOpen={onOpen} age={parseAge(title)} dateLabel={dateLabel} title={title} />}

            <p className="mt-8 text-[12px] uppercase tracking-[0.22em] text-ink-faint" aria-live="polite">
              {hint}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
