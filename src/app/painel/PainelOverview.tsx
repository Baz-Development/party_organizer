"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { GiftsSummary } from "@/lib/db/gifts";
import type { GuestStats } from "@/lib/db/guests";
import { useCountdown } from "@/components/Countdown";
import { Button } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import { brl, longDate, timeAgo } from "@/lib/format";
import type { Activity, EventSummary } from "@/lib/types";
import { alterarStatusEvento } from "./actions";

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
  giftsSummary,
  activity,
}: {
  event: EventSummary;
  siteUrl: string;
  guestStats: GuestStats;
  giftsSummary: GiftsSummary;
  activity: Activity[];
}) {
  const router = useRouter();
  const { days, hours, mins } = useCountdown(event.date);

  const isPublished = event.status === "publicado";
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusPending, startStatusTransition] = useTransition();

  const togglePublish = () => {
    setStatusError(null);
    startStatusTransition(async () => {
      const result = await alterarStatusEvento({
        eventId: event.id,
        status: isPublished ? "rascunho" : "publicado",
      });
      if (result.ok) {
        router.refresh();
      } else {
        setStatusError(result.message);
      }
    });
  };

  const pct = stats.convidados ? Math.round((stats.confirmados / stats.convidados) * 100) : 0;

  const [copied, setCopied] = useState(false);
  const publicUrl = `${siteUrl.replace(/^https?:\/\//, "")}${eventUrl(event)}`;

  const hasGallery = event.modules.includes("galeria");
  const hasMural = event.modules.includes("mural");

  // Os atalhos seguem os módulos do evento: sem presentes, galeria ou mural,
  // o atalho some em vez de levar a uma página inexistente.
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
    ...(event.modules.includes("presentes")
      ? [
          {
            title: "Presentes",
            desc: "Cadastre a lista de presentes e acompanhe as contribuições recebidas.",
            href: "/painel/presentes",
          },
        ]
      : []),
    ...(hasGallery || hasMural
      ? [
          {
            title:
              hasGallery && hasMural ? "Galeria e mural" : hasGallery ? "Galeria" : "Mural",
            desc:
              hasGallery && hasMural
                ? "Aprove fotos e recados enviados pelos convidados."
                : hasGallery
                  ? "Aprove as fotos enviadas pelos convidados."
                  : "Gerencie os recados enviados pelos convidados.",
            href: "/painel/moderacao",
          },
        ]
      : []),
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

      {/* Presentes ------------------------------------------------------ */}
      {event.modules.includes("presentes") && (
        <div className="mb-5 flex flex-wrap items-center gap-8 rounded-[20px] bg-paper p-8 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
          <div className="flex-1">
            <div className="mb-3.5 text-[13px] uppercase tracking-wider text-ink-soft">
              Presentes — só considera pagamento confirmado
            </div>
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="font-display text-[30px] font-semibold text-accent">
                  {giftsSummary.presenteados}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-soft">presenteados</div>
              </div>
              <div>
                <div className="font-display text-[30px] font-semibold text-ink-faint">
                  {giftsSummary.total}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-soft">no catálogo</div>
              </div>
              <div>
                <div className="font-display text-[30px] font-semibold text-ink-faint">
                  {brl(giftsSummary.arrecadado)}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-soft">arrecadados</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link público -------------------------------------------------- */}
      <div className="mb-9 flex flex-wrap items-center justify-between gap-6 rounded-[20px] bg-ink px-8 py-7">
        <div>
          <div className="mb-1.5 text-[13px] uppercase tracking-wider text-accent-soft">
            Convite do evento
          </div>
          <div className="text-[16px] text-paper">{publicUrl}</div>
          <div className="mt-2 text-[13px] text-accent-soft">
            {isPublished
              ? "Publicada — o link está no ar para os convidados."
              : `Em ${event.status} — o link só responde para você até publicar.`}
          </div>
          {statusError && (
            <p role="alert" className="mt-1.5 text-[13px] text-warn">
              {statusError}
            </p>
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
          {isPublished ? (
            <button
              onClick={togglePublish}
              disabled={statusPending}
              className="cursor-pointer rounded-[10px] border border-paper/30 px-6 py-3 text-[14.5px] font-semibold text-paper disabled:opacity-60"
            >
              {statusPending ? "Salvando…" : "Despublicar"}
            </button>
          ) : (
            <Button onClick={togglePublish} disabled={statusPending}>
              {statusPending ? "Salvando…" : "Publicar página"}
            </Button>
          )}
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
        {activity.map((a, i) => (
          <div
            key={a.id}
            className={`flex items-center gap-4 px-6 py-4 ${i > 0 ? "border-t border-line" : ""}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${KIND_COLORS[a.kind]}`} />
            <div className="flex-1 text-[14.5px]">
              <span className="font-semibold">{a.who}</span> {a.what}
            </div>
            <div className="shrink-0 text-[13px] text-ink-faint">{timeAgo(a.at)}</div>
          </div>
        ))}
        {activity.length === 0 && (
          <div className="px-6 py-10 text-center text-[14.5px] text-ink-faint">
            Nenhuma atividade ainda — RSVPs, presentes, fotos e recados aparecem aqui assim que
            acontecerem.
          </div>
        )}
      </div>
    </div>
  );
}
