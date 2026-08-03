import Link from "next/link";
import type { ReactNode } from "react";
import { themeVars } from "@/lib/themes";
import type { EventSummary } from "@/lib/types";

/**
 * Moldura das telas do convidado: coluna estreita centrada, no espírito do
 * mockup mobile do projeto de design, mas confortável também no desktop.
 */
export function GuestShell({
  event,
  backHref,
  children,
  width = 430,
}: {
  event: EventSummary;
  backHref?: string;
  children: ReactNode;
  width?: number;
}) {
  return (
    <div style={themeVars(event.themeKey)} className="flex min-h-screen justify-center bg-paper-3">
      <div
        style={{ maxWidth: width }}
        className="flex min-h-screen w-full flex-col bg-paper shadow-[0_0_60px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center gap-3 px-6 pb-3 pt-6">
          <Link
            href={backHref ?? `/e/${event.slug}`}
            aria-label="Voltar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink no-underline hover:bg-paper-2"
          >
            ←
          </Link>
          <div className="text-[13px] uppercase tracking-[2px] text-accent">{event.title}</div>
        </div>
        {children}
      </div>
    </div>
  );
}
