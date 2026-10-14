"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/Logo";

const WAX = "var(--ink-charcoal)";
const GOLD = "var(--accent)";
const HAIR = `color-mix(in srgb, ${GOLD} 50%, transparent)`;

/** Máscara de papel de convite: cantos internos côncavos (recortados em arco). */
function notchedMask(r: number): React.CSSProperties {
  const g = (at: string) => `radial-gradient(circle at ${at}, transparent ${r}px, #000 ${r + 0.5}px)`;
  const image = [g("0 0"), g("100% 0"), g("0 100%"), g("100% 100%")].join(",");
  const pos = "top left, top right, bottom left, bottom right";
  const css = {
    maskImage: image,
    maskPosition: pos,
    maskSize: "51% 51%",
    maskRepeat: "no-repeat",
    WebkitMaskImage: image,
    WebkitMaskPosition: pos,
    WebkitMaskSize: "51% 51%",
    WebkitMaskRepeat: "no-repeat",
  };
  return css as React.CSSProperties;
}

/**
 * Envelope lacrado: ao clicar, o lacre se parte, a aba abre e o convite para
 * uma call de 15 minutos aparece grande, em um modal no centro da tela.
 */
export function SealInvite({ callUrl }: { callUrl: string }) {
  const [broken, setBroken] = useState(false);
  const [modal, setModal] = useState(false);
  const [shown, setShown] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const ease = "transition-all duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none";

  function openSeal() {
    setBroken(true);
    window.setTimeout(() => setModal(true), 800);
  }

  // O convite "voa" do envelope até a posição final (FLIP): mede os dois
  // retângulos, parte do envelope e transiciona até a posição do popup.
  useLayoutEffect(() => {
    const paper = paperRef.current;
    const peek = peekRef.current;
    if (!modal || !paper || !peek) return;
    const to = paper.getBoundingClientRect();
    const from = peek.getBoundingClientRect();
    const scale = Math.min(1, from.width / to.width);
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    paper.style.transition = "none";
    paper.style.transform = `translate(${dx}px, ${dy}px) scale(${scale}) rotate(-5deg)`;
    paper.getBoundingClientRect(); // força reflow
    const id = requestAnimationFrame(() => {
      paper.style.transition = "transform 1200ms cubic-bezier(.2,.8,.2,1)";
      paper.style.transform = "none";
    });
    return () => cancelAnimationFrame(id);
  }, [modal]);

  // anima a entrada do modal um frame depois de montá-lo
  useEffect(() => {
    if (!modal) {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModal(false);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [modal]);

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col items-center">
      <div className="relative h-[270px] w-full" style={{ perspective: 1100 }}>
        {/* fundo do envelope */}
        <div
          className="absolute inset-x-0 bottom-0 h-[240px] rounded-[10px]"
          style={{
            background: `linear-gradient(160deg, color-mix(in srgb, ${WAX} 92%, white), ${WAX})`,
            boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
          }}
        />

        {/* ponta do convite aparecendo ao abrir */}
        <div
          ref={peekRef}
          aria-hidden
          className={`absolute inset-x-6 bottom-4 z-10 h-[220px] rounded-[6px] bg-paper ${ease} ${
            broken ? "-translate-y-[70px] delay-300" : "translate-y-0"
          } ${modal ? "opacity-0 !transition-none" : ""}`}
          style={{ border: `1px solid ${GOLD}` }}
        >
          <div className="absolute inset-[6px] flex justify-center pt-[52px]" style={{ border: `1px solid ${HAIR}` }}>
            <Logo variant="lockup" height={62} className="!h-[62px] !w-auto max-w-none shrink-0" />
          </div>
        </div>

        {/* frente do envelope (bolso) */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[240px] rounded-[10px]"
          style={{
            clipPath: "polygon(0 0, 50% 54%, 100% 0, 100% 100%, 0 100%)",
            background: `linear-gradient(180deg, color-mix(in srgb, ${WAX} 80%, white), ${WAX})`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${GOLD} 40%, transparent)`,
          }}
        />

        {/* aba */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-[110px] h-[130px] origin-top ${ease} ${
            broken ? "z-[5] delay-150" : "z-30"
          }`}
          style={{
            transform: broken ? "rotateX(180deg)" : "rotateX(0deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="h-full w-full"
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: `linear-gradient(180deg, color-mix(in srgb, ${WAX} 70%, white), ${WAX})`,
            }}
          />
        </div>

        {/* lacre */}
        <button
          type="button"
          onClick={openSeal}
          disabled={broken}
          aria-label="Romper o lacre e abrir o convite"
          className={`absolute bottom-[92px] left-1/2 z-40 h-[76px] w-[76px] -translate-x-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
            broken ? "pointer-events-none" : "cursor-pointer hover:scale-105"
          } transition-transform motion-reduce:transition-none`}
        >
          {(["left", "right"] as const).map((side) => (
            <span
              key={side}
              className={`absolute inset-0 flex items-center justify-center rounded-full ${ease} ${
                broken
                  ? `translate-y-12 opacity-0 ${side === "left" ? "-translate-x-7 -rotate-[32deg]" : "translate-x-7 rotate-[32deg]"}`
                  : "glow-pulse"
              }`}
              style={{
                background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${GOLD} 55%, white), ${GOLD} 55%, var(--accent-strong))`,
                boxShadow: "0 6px 16px rgba(0,0,0,0.4), inset 0 0 0 3px rgba(0,0,0,0.18)",
                clipPath:
                  side === "left"
                    ? "polygon(0 0, 54% 0, 44% 35%, 56% 65%, 46% 100%, 0 100%)"
                    : "polygon(54% 0, 100% 0, 100% 100%, 46% 100%, 56% 65%, 44% 35%)",
              }}
            >
              <span
                className="flex h-[54px] w-[54px] items-center justify-center rounded-full"
                style={{ background: WAX }}
              >
                <Logo variant="mark" height={42} />
              </span>
            </span>
          ))}
        </button>
      </div>

      {broken && !modal ? (
        <button
          type="button"
          onClick={() => setModal(true)}
          className="mt-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-accent-strong underline-offset-4 hover:underline"
        >
          Ver convite
        </button>
      ) : (
        <p
          className={`mt-6 text-center text-[12px] uppercase tracking-[0.22em] text-ink-faint transition-opacity duration-500 ${
            broken ? "opacity-0" : ""
          }`}
        >
          Toque no lacre para abrir
        </p>
      )}

      {modal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Convite para uma call de 15 minutos"
            className={`fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-8 transition-opacity duration-500 motion-reduce:transition-none ${
              shown ? "opacity-100" : "opacity-0"
            }`}
            style={{ background: "rgba(10,8,6,0.72)", backdropFilter: "blur(6px)" }}
            onClick={(e) => e.target === e.currentTarget && setModal(false)}
          >
            <div
              ref={paperRef}
              className="relative my-auto w-full max-w-[600px] text-center will-change-transform"
              style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.55))" }}
            >
              {/* papel: moldura dourada + folha, ambos com cantos recortados em arco */}
              <div className="absolute inset-0" style={{ background: GOLD, ...notchedMask(34) }} />
              <div className="absolute inset-[2px] bg-paper" style={notchedMask(32)} />
              <div
                className="absolute inset-[2px] opacity-60"
                style={{
                  ...notchedMask(32),
                  background:
                    "radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)",
                }}
              />
              {/* filete interno com ornamentos nos cantos */}
              <div className="pointer-events-none absolute inset-[18px]" style={{ border: `1px solid ${HAIR}` }}>
                {["-left-[5px] -top-[5px]", "-right-[5px] -top-[5px]", "-bottom-[5px] -left-[5px]", "-bottom-[5px] -right-[5px]"].map((p) => (
                  <span
                    key={p}
                    className={`absolute ${p} text-[9px] leading-none`}
                    style={{ color: GOLD, background: "var(--paper)" }}
                  >
                    ◆
                  </span>
                ))}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setModal(false)}
                aria-label="Fechar convite"
                className="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full text-[20px] leading-none text-ink-soft transition hover:bg-paper-2 hover:text-ink"
              >
                ×
              </button>
              <div className="relative flex flex-col items-center px-8 py-14 sm:px-16 sm:py-[72px]">
                <div
                  className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-full"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${GOLD} 55%, white), ${GOLD} 60%, var(--accent-strong))`,
                    boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.16)",
                  }}
                >
                  <span className="flex h-[50px] w-[50px] items-center justify-center rounded-full" style={{ background: WAX }}>
                    <Logo variant="mark" height={38} />
                  </span>
                </div>
                <Logo variant="lockup" height={34} className="!h-[34px] !w-auto max-w-none shrink-0" />
                <div className="my-7 flex w-full max-w-[360px] items-center gap-4">
                  <span className="h-px flex-1" style={{ background: HAIR }} />
                  <span className="text-[12px]" style={{ color: GOLD }}>◆</span>
                  <span className="h-px flex-1" style={{ background: HAIR }} />
                </div>
                <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.34em] text-ink-faint">
                  Convite pessoal
                </div>
                <h3 className="mb-4 font-display text-[30px] font-semibold leading-[1.15] text-ink sm:text-[40px]">
                  Uma conversa de 15 minutos sobre a sua festa
                </h3>
                <p className="mb-9 max-w-[440px] text-[15.5px] leading-relaxed text-ink-soft">
                  Conte o que você imagina. Mostramos, sem compromisso, como o convite da sua
                  celebração pode ser inesquecível.
                </p>
                <a
                  href={callUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sheen inline-block rounded-full bg-accent px-10 py-4 text-[15px] font-semibold tracking-wide text-on-accent"
                >
                  Reservar meu horário
                </a>
                <div className="mt-6 text-[11.5px] uppercase tracking-[0.24em] text-ink-faint">
                  Sem compromisso · 15 minutos
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
