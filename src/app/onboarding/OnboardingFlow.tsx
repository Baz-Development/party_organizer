"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImageSlot } from "@/components/ImageSlot";
import { Button, Field, Input, Toggle } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import type { EventKind, ModuleId } from "@/lib/types";
import { criarEvento } from "./actions";

const EVENT_TYPES: { id: EventKind; label: string }[] = [
  { id: "casamento", label: "Casamento" },
  { id: "debutante", label: "Debutante (15 anos)" },
  { id: "infantil", label: "Aniversário infantil" },
  { id: "corporativo", label: "Evento corporativo" },
  { id: "formatura", label: "Formatura" },
];

const MODULES: { id: ModuleId; name: string; desc: string; locked: boolean }[] = [
  {
    id: "rsvp",
    name: "Confirmação de presença (RSVP)",
    desc: "Convidados confirmam presença, acompanhantes e restrições em poucos toques.",
    locked: true,
  },
  {
    id: "presentes",
    name: "Lista de presentes",
    desc: "Uma vitrine elegante de presentes e cotas, com checkout integrado (Pix e cartão).",
    locked: false,
  },
  {
    id: "amigo-secreto",
    name: "Amigo Secreto",
    desc: "Sorteio automático entre convidados, com lista de desejos e revelação surpresa.",
    locked: false,
  },
  {
    id: "cardapio",
    name: "Votação de bar e cardápio",
    desc: "Convidados escolhem seus pratos e bebidas favoritos antes da festa.",
    locked: false,
  },
  {
    id: "galeria",
    name: "Galeria de fotos",
    desc: "Um mosaico coletivo onde convidados sobem fotos do grande dia.",
    locked: false,
  },
  {
    id: "mural",
    name: "Mural de recados",
    desc: "Mensagens carinhosas dos convidados, guardadas para sempre.",
    locked: false,
  },
];

const STEP_LABELS = ["Tipo de evento", "Detalhes", "Módulos", "Pronto"];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<EventKind | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [hosts, setHosts] = useState("");

  const [on, setOn] = useState<Record<string, boolean>>({
    rsvp: true,
    presentes: false,
    "amigo-secreto": false,
    cardapio: false,
    galeria: true,
    mural: true,
  });

  const [createdEvent, setCreatedEvent] = useState<{ id: string; slug: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const typeLabel = EVENT_TYPES.find((t) => t.id === kind)?.label ?? "evento";
  const activeModules = MODULES.filter((m) => m.locked || on[m.id]);
  const detalhesOk = title.trim().length > 0 && date.length > 0;

  const concluir = () => {
    setError(null);
    startTransition(async () => {
      const result = await criarEvento({
        kind,
        title: title.trim(),
        date,
        venue: venue.trim() || undefined,
        city: city.trim() || undefined,
        hosts: hosts.trim() || undefined,
        modules: activeModules.map((m) => m.id),
      });

      if (result.ok) {
        setCreatedEvent({ id: result.id, slug: result.slug });
        setStep(4);
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-paper-3 px-6 py-14">
      <div className="mx-auto max-w-[880px]">
        {/* Passos ---------------------------------------------------- */}
        <ol className="mb-12 flex items-start justify-center">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const current = step === n;
            const isLast = i === STEP_LABELS.length - 1;
            return (
              <li key={label} className={`flex items-center ${isLast ? "flex-none" : "flex-1"}`}>
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={`flex h-8.5 w-8.5 items-center justify-center rounded-full text-sm font-bold ${
                      done || current
                        ? "bg-accent text-on-accent"
                        : "bg-[rgba(42,39,36,0.15)] text-ink-soft"
                    }`}
                  >
                    {done ? "✓" : n}
                  </span>
                  <span
                    className={`whitespace-nowrap text-[12.5px] font-semibold ${
                      current ? "text-ink" : "text-ink-faint"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {!isLast && (
                  <span
                    className={`mx-3 h-0.5 flex-1 -translate-y-3 ${
                      step > n ? "bg-accent" : "bg-[rgba(42,39,36,0.15)]"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>

        <div className="rounded-[24px] bg-paper p-7 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:p-14">
          {/* Passo 1 — tipo ------------------------------------------ */}
          {step === 1 && (
            <div className="animate-[fade-up_0.35s_ease_both]">
              <div className="mb-10 text-center">
                <h1 className="mb-2.5 font-display text-[clamp(24px,4vw,32px)] font-semibold">
                  Que tipo de evento você vai celebrar?
                </h1>
                <p className="text-[16px] text-ink-soft">
                  Vamos preparar a experiência certa para o seu grande dia.
                </p>
              </div>

              <div className="mb-11 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {EVENT_TYPES.map((et) => {
                  const selected = kind === et.id;
                  return (
                    <button
                      key={et.id}
                      onClick={() => setKind(et.id)}
                      className={`flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-white text-left ${
                        selected ? "border-accent" : "border-[rgba(42,39,36,0.1)]"
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full">
                        <ImageSlot placeholder={et.label} compact />
                        {selected && (
                          <span className="pointer-events-none absolute right-2 top-2 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-on-accent">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="px-3 py-3.5 text-center text-[14.5px] font-semibold">
                        {et.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button size="lg" disabled={!kind} onClick={() => setStep(2)}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Passo 2 — detalhes -------------------------------------- */}
          {step === 2 && (
            <div className="animate-[fade-up_0.35s_ease_both]">
              <div className="mb-9 text-center">
                <h1 className="mb-2.5 font-display text-[clamp(24px,4vw,32px)] font-semibold">
                  Conte o essencial sobre a festa
                </h1>
                <p className="text-[16px] text-ink-soft">
                  Dá para mudar tudo depois, no editor da página.
                </p>
              </div>

              <div className="mx-auto mb-10 grid max-w-[560px] gap-5">
                <Field label="Título do evento" hint="Vira o endereço público do convite.">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Marina & Thiago"
                    required
                  />
                </Field>
                <Field label="Data e hora">
                  <Input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Local">
                    <Input
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="Fazenda Santa Clara"
                    />
                  </Field>
                  <Field label="Cidade">
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Itu – SP"
                    />
                  </Field>
                </div>
                <Field label="Anfitriões" hint="Quem assina o convite.">
                  <Input
                    value={hosts}
                    onChange={(e) => setHosts(e.target.value)}
                    placeholder="Marina & Thiago"
                  />
                </Field>
              </div>

              <div className="flex justify-between">
                <Button size="lg" variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button size="lg" disabled={!detalhesOk} onClick={() => setStep(3)}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Passo 3 — módulos --------------------------------------- */}
          {step === 3 && (
            <div className="animate-[fade-up_0.35s_ease_both]">
              <div className="mb-9 text-center">
                <h1 className="mb-2.5 font-display text-[clamp(24px,4vw,32px)] font-semibold">
                  Quais experiências você quer ativar?
                </h1>
                <p className="text-[16px] text-ink-soft">
                  Você pode mudar isso a qualquer momento no painel.
                </p>
              </div>

              <div className="mb-10 flex flex-col gap-px overflow-hidden rounded-2xl bg-line">
                {MODULES.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-6 bg-paper px-6 py-5.5"
                  >
                    <div>
                      <div className="mb-1 font-display text-[18px] font-semibold">{m.name}</div>
                      <div className="max-w-[480px] text-[14.5px] leading-relaxed text-ink-soft">
                        {m.desc}
                        {m.locked && (
                          <span className="ml-1.5 text-[12.5px] text-ink-faint">
                            (sempre ativo)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={m.locked ? "pointer-events-none opacity-70" : ""}>
                      <Toggle
                        label={m.name}
                        checked={m.locked ? true : !!on[m.id]}
                        onChange={(v) => setOn((s) => ({ ...s, [m.id]: v }))}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p role="alert" className="mb-5 text-center text-[14px] text-danger">
                  {error}
                </p>
              )}

              <div className="flex justify-between">
                <Button size="lg" variant="outline" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button size="lg" disabled={pending} onClick={concluir}>
                  {pending ? "Criando…" : "Concluir configuração"}
                </Button>
              </div>
            </div>
          )}

          {/* Passo 4 — pronto ---------------------------------------- */}
          {step === 4 && (
            <div className="animate-[fade-up_0.4s_ease_both] py-6 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-[28px] text-on-accent">
                ✓
              </div>
              <h1 className="mb-2.5 font-display text-[30px] font-semibold">Tudo pronto!</h1>
              <p className="mb-8 text-[16px] text-ink-soft">
                Seu evento de {typeLabel} está configurado com:
              </p>

              <div className="mb-8 flex flex-wrap justify-center gap-2.5">
                {activeModules.map((m) => (
                  <span
                    key={m.id}
                    className="rounded-full bg-paper-2 px-4.5 py-2.5 text-sm font-semibold"
                  >
                    {m.name}
                  </span>
                ))}
              </div>

              {createdEvent && (
                <p className="mb-8 text-[14.5px] leading-relaxed text-ink-soft">
                  Endereço do convite:{" "}
                  <Link href={eventUrl(createdEvent)} className="font-semibold text-accent">
                    {eventUrl(createdEvent)}
                  </Link>
                  <br />
                  Ele começa em rascunho — publique quando estiver pronto.
                </p>
              )}

              <Button size="lg" onClick={() => router.push("/painel")}>
                Ir para o painel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
