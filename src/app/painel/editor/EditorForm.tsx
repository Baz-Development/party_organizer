"use client";

import { useState, useTransition } from "react";
import { ImageSlot } from "@/components/ImageSlot";
import { Button, Input, Textarea, Toggle } from "@/components/ui";
import { longDate } from "@/lib/format";
import { THEME_LIST, THEMES } from "@/lib/themes";
import type { EventSummary, ModuleId, ScheduleItem, ThemeKey } from "@/lib/types";
import { salvarEditor } from "./actions";

const TYPO = {
  classico: {
    label: "Clássico",
    font: "var(--font-playfair), serif",
    weight: 600,
    style: "normal" as const,
    size: "38px",
  },
  moderno: {
    label: "Moderno",
    font: "var(--font-inter), sans-serif",
    weight: 700,
    style: "normal" as const,
    size: "34px",
  },
  romantico: {
    label: "Romântico",
    font: "var(--font-cormorant), serif",
    weight: 600,
    style: "italic" as const,
    size: "44px",
  },
};

type TypoKey = keyof typeof TYPO;

/**
 * RSVP não aparece: é sempre ativo, como no onboarding. Ele é reanexado na
 * hora de salvar para que desmarcar tudo aqui não desligue a confirmação de
 * presença.
 */
const MODULE_OPTIONS: { id: ModuleId; label: string }[] = [
  { id: "cronograma", label: "Cronograma" },
  { id: "local", label: "Local e mapa" },
  { id: "presentes", label: "Lista de presentes" },
  { id: "galeria", label: "Galeria de fotos" },
  { id: "mural", label: "Mural de recados" },
  { id: "cardapio", label: "Votação de cardápio" },
  { id: "amigo-secreto", label: "Amigo secreto" },
];

export function EditorForm({ event }: { event: EventSummary }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>(event.themeKey);
  const [typo, setTypo] = useState<TypoKey>("classico");
  const [hosts, setHosts] = useState(event.hosts);
  const [eyebrow, setEyebrow] = useState(event.eyebrow);
  const [welcome, setWelcome] = useState(event.welcome);
  const [venue, setVenue] = useState(event.venue);
  const [city, setCity] = useState(event.city);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(event.schedule);
  const [modules, setModules] = useState<Record<string, boolean>>(
    Object.fromEntries(MODULE_OPTIONS.map((m) => [m.id, event.modules.includes(m.id)])),
  );

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const theme = THEMES[themeKey];
  const t = TYPO[typo];
  const dateLocation = [longDate(event.date), [venue, city].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");

  const salvar = () => {
    setError(null);
    startTransition(async () => {
      const result = await salvarEditor({
        eventId: event.id,
        content: { hosts, eyebrow, welcome, venue, city, themeKey },
        modules: [
          "rsvp",
          ...MODULE_OPTIONS.filter((m) => modules[m.id]).map((m) => m.id),
        ],
        schedule: schedule.filter((item) => item.time.trim() && item.title.trim()),
      });

      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.message);
      }
    });
  };

  const patchItem = (index: number, patch: Partial<ScheduleItem>) =>
    setSchedule((items) =>
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );

  return (
    <div
      className="flex min-h-screen flex-col lg:flex-row"
      style={
        {
          "--accent": theme.accent,
          "--accent-strong": theme.accentStrong,
          "--accent-soft": theme.accentSoft,
        } as React.CSSProperties
      }
    >
      {/* Painel de controles ------------------------------------------ */}
      <aside className="w-full shrink-0 border-b border-line bg-paper px-7 py-8 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:w-[380px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <span className="mb-4 inline-block rounded-full bg-paper-2 px-3 py-1.5 text-xs font-semibold tracking-wide text-ink-soft">
          Editor sem código
        </span>
        <h1 className="mb-1.5 font-display text-[24px] font-semibold">Personalize sua página</h1>
        <p className="mb-8 text-sm leading-relaxed text-ink-soft">
          Poucos ajustes, sempre com um resultado elegante. Tudo que você muda aparece na
          pré-visualização ao lado.
        </p>

        {/* Capa */}
        <Group title="Foto de capa">
          <div className="flex items-center gap-3 rounded-xl bg-paper-2 p-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
              <ImageSlot placeholder="Capa" compact />
            </div>
            <div className="text-[13.5px] leading-relaxed text-ink-soft">
              Upload de imagem chega junto com a galeria — por enquanto a capa é
              um placeholder.
            </div>
          </div>
        </Group>

        {/* Cor */}
        <Group title="Cor de destaque">
          <div className="flex gap-2.5">
            {THEME_LIST.map((sw) => (
              <button
                key={sw.key}
                onClick={() => setThemeKey(sw.key)}
                aria-label={sw.label}
                title={sw.label}
                style={{ background: sw.accent }}
                className={`h-9 w-9 cursor-pointer rounded-full shadow-[0_0_0_1px_rgba(42,39,36,0.1)] ${
                  themeKey === sw.key ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""
                }`}
              />
            ))}
          </div>
        </Group>

        {/* Tipografia */}
        <Group title="Tema tipográfico">
          <div className="flex flex-col gap-2.5">
            {(Object.keys(TYPO) as TypoKey[]).map((key) => {
              const opt = TYPO[key];
              const active = typo === key;
              return (
                <button
                  key={key}
                  onClick={() => setTypo(key)}
                  className={`flex cursor-pointer items-center gap-3.5 rounded-[10px] border px-3.5 py-3 text-left ${
                    active ? "border-accent bg-paper-2" : "border-[rgba(42,39,36,0.15)] bg-white"
                  }`}
                >
                  <span
                    className="w-8 shrink-0 text-xl"
                    style={{
                      fontFamily: opt.font,
                      fontWeight: opt.weight,
                      fontStyle: opt.style,
                    }}
                  >
                    Aa
                  </span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-ink-faint">
            A tipografia ainda é só da pré-visualização — não faz parte do que é
            salvo.
          </p>
        </Group>

        {/* Textos */}
        <Group title="Textos">
          <div className="flex flex-col gap-3.5">
            <SmallField label="Chamada (sobre o título)">
              <Input
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                className="px-3.5 py-2.5 text-sm"
              />
            </SmallField>
            <SmallField label="Nome dos anfitriões">
              <Input
                value={hosts}
                onChange={(e) => setHosts(e.target.value)}
                className="px-3.5 py-2.5 text-sm"
              />
            </SmallField>
            <SmallField label="Mensagem de boas-vindas">
              <Textarea
                value={welcome}
                onChange={(e) => setWelcome(e.target.value)}
                className="min-h-20 resize-none px-3.5 py-2.5 text-sm"
              />
            </SmallField>
            <SmallField label="Local">
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="px-3.5 py-2.5 text-sm"
              />
            </SmallField>
            <SmallField label="Cidade">
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="px-3.5 py-2.5 text-sm"
              />
            </SmallField>
          </div>
        </Group>

        {/* Cronograma */}
        <Group title="Cronograma">
          <div className="flex flex-col gap-3">
            {schedule.map((item, index) => (
              <div
                key={index}
                className="rounded-[10px] border border-[rgba(42,39,36,0.15)] bg-white p-3"
              >
                <div className="mb-2 flex gap-2">
                  <Input
                    value={item.time}
                    onChange={(e) => patchItem(index, { time: e.target.value })}
                    placeholder="16h00"
                    aria-label="Horário"
                    className="w-24 px-3 py-2 text-sm"
                  />
                  <Input
                    value={item.title}
                    onChange={(e) => patchItem(index, { title: e.target.value })}
                    placeholder="Cerimônia"
                    aria-label="Título"
                    className="flex-1 px-3 py-2 text-sm"
                  />
                </div>
                <Input
                  value={item.desc}
                  onChange={(e) => patchItem(index, { desc: e.target.value })}
                  placeholder="Detalhe (opcional)"
                  aria-label="Descrição"
                  className="px-3 py-2 text-sm"
                />
                <button
                  onClick={() =>
                    setSchedule((items) => items.filter((_, i) => i !== index))
                  }
                  className="mt-2 cursor-pointer text-[12.5px] font-semibold text-danger"
                >
                  Remover
                </button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSchedule((items) => [...items, { time: "", title: "", desc: "" }])
              }
            >
              Adicionar item
            </Button>
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-ink-faint">
            A ordem da lista é a ordem que o convidado vê.
          </p>
        </Group>

        {/* Módulos */}
        <Group title="Seções ativas">
          <div className="flex flex-col gap-3">
            {MODULE_OPTIONS.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-4">
                <span className="text-sm">{m.label}</span>
                <Toggle
                  label={m.label}
                  checked={!!modules[m.id]}
                  onChange={(v) => setModules((s) => ({ ...s, [m.id]: v }))}
                />
              </div>
            ))}
          </div>
        </Group>

        <Button full size="lg" className="mt-2" disabled={pending} onClick={salvar}>
          {pending ? "Salvando…" : saved ? "Alterações salvas ✓" : "Salvar alterações"}
        </Button>

        {error && (
          <p role="alert" className="mt-3 text-center text-[13px] text-danger">
            {error}
          </p>
        )}
      </aside>

      {/* Pré-visualização --------------------------------------------- */}
      <main className="flex flex-1 flex-col items-center bg-paper-3 px-6 py-12">
        <div className="mb-5 text-[13px] uppercase tracking-wider text-ink-soft">
          Pré-visualização ao vivo
        </div>

        <div className="w-full max-w-[390px] overflow-hidden rounded-[28px] bg-paper shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="relative h-[460px] w-full">
            <ImageSlot placeholder="Foto de capa" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(20,18,15,0.05)_0%,rgba(20,18,15,0.15)_55%,rgba(20,18,15,0.72)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-6.5 pt-6 text-center">
              <div className="mb-2 text-xs uppercase tracking-[2.5px] text-paper-2/85">
                {eyebrow}
              </div>
              <div
                className="leading-[1.1] text-white"
                style={{
                  fontFamily: t.font,
                  fontWeight: t.weight,
                  fontStyle: t.style,
                  fontSize: t.size,
                }}
              >
                {hosts}
              </div>
              <div className="mt-3 text-sm text-paper-2">{dateLocation}</div>
            </div>
          </div>
          <div className="px-6 pb-2 pt-7 text-center">
            <p className="text-[15px] leading-[1.65] text-ink-2">{welcome}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 px-6 pt-5">
            {MODULE_OPTIONS.filter((m) => modules[m.id]).map((m) => (
              <span
                key={m.id}
                className="rounded-full border border-line-strong px-3 py-1.5 text-[12px] text-ink-soft"
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="px-6 pb-8 pt-5">
            <Button full size="lg">
              Confirmar Presença
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3 text-[12.5px] uppercase tracking-wider text-ink-soft">{title}</div>
      {children}
    </section>
  );
}

function SmallField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
