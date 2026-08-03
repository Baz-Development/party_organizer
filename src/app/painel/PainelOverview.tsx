"use client";

import Link from "next/link";
import { useState } from "react";
import type { GuestStats } from "@/lib/db/guests";
import { useCountdown } from "@/components/Countdown";
import { Button } from "@/components/ui";
import { ACTIVITY } from "@/lib/fixtures/painel";
import { longDate } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

const KIND_COLORS: Record<string, string> = {
  rsvp: "bg-accent",
  presente: "bg-ok",
  foto: "bg-warn",
  mural: "bg-accent-soft",
  sistema: "bg-ink-faint",
};

export function PainelOverview({
  event,
  siteUrl,
  guestStats: stats,
}: {
  event: EventSummary;
  siteUrl: string;
  guestStats: GuestStats;
}) {
  const { days, hours, mins } = useCountdown(event.date);

  // Atividade continua vindo de fixture — chega nos changes seguintes
  // (presentes, galeria, mural).
  const pct = stats.convidados ? Math.round((stats.confirmados / stats.convidados) * 100) : 0;

  const [copied, setCopied] = useState(false);
  const publicUrl = `${siteUrl.replace(/^https?:\/\//, "")}/e/${event.slug}`;

  const shortcuts = [
    {
      title: "Convidados",
      desc: "Gerencie sua lista, veja detalhes de RSVP e envie lembretes.",
      href: "/painel/convidados",
    },
    {
      title: "Editor da Página",
      desc: "Personalize fotos, textos e cor de destaque do seu convite.",
      href: "/painel/editor",
    },
    {
      title: "Presentes",
      desc: "Acompanhe a lista de presentes e as contribuições recebidas.",
      href: `/e/${event.slug}/presentes`,
    },
    {
      title: "Galeria e mural",
      desc: "Aprove fotos e recados enviados pelos convidados.",
      href: `/e/${event.slug}/galeria`,
    },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 pb-16">
      {/* Cabeçalho ---------------------------------------------------- */}
      <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">
            Olá, {event.hosts.split(" ")[0]}
          </div>
          <h1 className="font-display text-[clamp(24px,4vw,32px)] font-semibold">
            {event.kind === "casamento" ? "Casamento de " : ""}
            {event.title}
          </h1>
        </div>
        <div className="text-[14.5px] text-ink-soft">
          {longDate(event.date)} · {event.venue}, {event.city}
        </div>
      </div>

      {/* Contagem + confirmações -------------------------------------- */}
      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col justify-center rounded-[20px] bg-paper p-8 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
          <div className="mb-4.5 text-[13px] uppercase tracking-wider text-ink-soft">
            Faltam para o grande dia
          </div>
          <div className="flex gap-6">
            {[
              { v: days, l: "dias" },
              { v: hours, l: "horas" },
              { v: mins, l: "min" },
            ].map((u) => (
              <div key={u.l}>
                <div className="font-display text-[44px] font-semibold tabular-nums leading-none">
                  {u.v}
                </div>
                <div className="mt-1.5 text-[12.5px] uppercase tracking-wide text-ink-faint">
                  {u.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 rounded-[20px] bg-paper p-8 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
          <div
            className="flex h-30 w-30 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--accent) 0% ${pct}%, rgba(42,39,36,0.1) ${pct}% 100%)`,
            }}
          >
            <div className="flex h-22 w-22 items-center justify-center rounded-full bg-paper font-display text-[22px] font-semibold">
              {pct}%
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-3.5 text-[13px] uppercase tracking-wider text-ink-soft">
              Confirmações de presença
            </div>
            <div className="flex gap-8">
              <div>
                <div className="font-display text-[30px] font-semibold text-accent">
                  {stats.confirmados}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-soft">confirmados</div>
              </div>
              <div>
                <div className="font-display text-[30px] font-semibold text-ink-faint">
                  {stats.pendentes}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-soft">pendentes</div>
              </div>
              <div>
                <div className="font-display text-[30px] font-semibold text-ink-faint">
                  {stats.totalPessoas}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-soft">pessoas</div>
              </div>
            </div>
            <div className="mt-3.5 text-[13px] text-ink-faint">
              de {stats.convidados} convidados no total
            </div>
          </div>
        </div>
      </div>

      {/* Link público -------------------------------------------------- */}
      <div className="mb-9 flex flex-wrap items-center justify-between gap-6 rounded-[20px] bg-ink px-8 py-7">
        <div>
          <div className="mb-1.5 text-[13px] uppercase tracking-wider text-accent-soft">
            Convite do evento
          </div>
          <div className="text-[16px] text-paper">{publicUrl}</div>
          {event.status !== "publicado" && (
            <div className="mt-2 text-[13px] text-accent-soft">
              Em {event.status} — o link só responde para você até publicar.
            </div>
          )}
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(`https://${publicUrl}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="cursor-pointer rounded-[10px] border border-paper/30 px-6 py-3 text-[14.5px] font-semibold text-paper"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
          <Button>Compartilhar</Button>
        </div>
      </div>

      {/* Atalhos ------------------------------------------------------- */}
      <h2 className="mb-4 font-display text-[20px] font-semibold">Gerenciar evento</h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className="block rounded-2xl bg-paper px-6 py-6.5 text-ink no-underline shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition hover:shadow-[0_10px_28px_rgba(0,0,0,0.07)]"
          >
            <div className="mb-2 font-display text-[19px] font-semibold">{s.title}</div>
            <div className="mb-4 text-sm leading-relaxed text-ink-soft">{s.desc}</div>
            <div className="text-[13.5px] font-semibold text-accent">Acessar →</div>
          </Link>
        ))}
      </div>

      {/* Atividade ----------------------------------------------------- */}
      <h2 className="mb-4 font-display text-[20px] font-semibold">Atividade recente</h2>
      <div className="overflow-hidden rounded-2xl bg-paper shadow-[0_6px_20px_rgba(0,0,0,0.04)]">
        {ACTIVITY.map((a, i) => (
          <div
            key={a.id}
            className={`flex items-center gap-4 px-6 py-4 ${i > 0 ? "border-t border-line" : ""}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${KIND_COLORS[a.kind]}`} />
            <div className="flex-1 text-[14.5px]">
              <span className="font-semibold">{a.who}</span> {a.what}
            </div>
            <div className="shrink-0 text-[13px] text-ink-faint">{a.at}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
