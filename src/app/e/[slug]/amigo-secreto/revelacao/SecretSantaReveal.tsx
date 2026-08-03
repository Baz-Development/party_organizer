"use client";

import { useEffect, useRef, useState } from "react";
import { GuestShell } from "@/components/GuestShell";
import { Button } from "@/components/ui";
import { SECRET_SANTA_DRAW } from "@/lib/fixtures/secret-santa";
import type { EventSummary } from "@/lib/types";

type Stage = "closed" | "opening" | "revealed";

export function SecretSantaReveal({ event }: { event: EventSummary }) {
  const [stage, setStage] = useState<Stage>("closed");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const open = () => {
    if (stage !== "closed") return;
    setStage("opening");
    timer.current = setTimeout(() => setStage("revealed"), 650);
  };

  return (
    <GuestShell event={event} backHref={`/e/${event.slug}/amigo-secreto`}>
      <div className="flex flex-1 flex-col items-center justify-center px-7 py-6">
        {stage !== "revealed" ? (
          <div className="animate-[fade-up_0.4s_ease_both] text-center">
            <h1 className="mb-2.5 font-display text-[24px] font-semibold">Chegou a hora!</h1>
            <p className="mx-auto mb-9 max-w-[260px] text-[15px] text-ink-soft">
              Toque no envelope para descobrir quem você tirou no amigo secreto.
            </p>

            <button
              onClick={open}
              aria-label="Abrir envelope"
              className="cursor-pointer border-none bg-transparent p-0 [perspective:600px]"
            >
              <div className="relative h-40 w-60">
                {/* Corpo do envelope */}
                <div className="absolute inset-x-0 bottom-0 top-6 rounded-b-[10px] border border-line bg-paper-2 shadow-[0_12px_30px_rgba(0,0,0,0.1)]" />
                {/* Aba */}
                <div
                  className="absolute left-0 top-0 z-[5] h-0 w-0 origin-top transition-transform duration-600 ease-out"
                  style={{
                    borderLeft: "120px solid transparent",
                    borderRight: "120px solid transparent",
                    borderTop: "88px solid #e7ded1",
                    transform:
                      stage === "closed" ? "rotateX(0deg)" : "rotateX(-170deg)",
                  }}
                />
                {/* Lacre */}
                <div className="absolute left-1/2 top-5 z-[6] flex h-8.5 w-8.5 -translate-x-1/2 items-center justify-center rounded-full bg-accent">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-paper" />
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="w-full animate-[fade-up_0.5s_ease_both] text-center">
            <div className="mb-3.5 text-[13px] uppercase tracking-[2px] text-accent">Você tirou</div>
            <div className="mb-7 font-display text-[36px] font-semibold">
              {SECRET_SANTA_DRAW.target}
            </div>

            <div className="mb-7 rounded-2xl border border-line bg-white px-5 py-5.5 text-left">
              <div className="mb-3.5 text-[13px] tracking-wide text-ink-soft">Lista de desejos</div>
              <div className="flex flex-col gap-2.5">
                {SECRET_SANTA_DRAW.targetWishlist.map((item) => (
                  <div key={item} className="rounded-lg bg-paper-2 px-3 py-2.5 text-[15px]">
                    {item}
                  </div>
                ))}
              </div>
              {SECRET_SANTA_DRAW.targetNote && (
                <p className="mt-4 text-[14px] italic leading-relaxed text-ink-soft">
                  “{SECRET_SANTA_DRAW.targetNote}”
                </p>
              )}
            </div>

            <p className="mb-6 text-sm text-ink-faint">Guarde segredo até o grande dia!</p>
            <Button size="lg" onClick={() => setStage("closed")}>
              Combinado!
            </Button>
          </div>
        )}
      </div>
    </GuestShell>
  );
}
