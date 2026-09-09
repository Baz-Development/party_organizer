"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { EventPage } from "@/app/[id]/[slug]/EventPage";
import { ImageSlot } from "@/components/ImageSlot";
import { Button, Input, Textarea, Toggle } from "@/components/ui";
import { THEME_LIST, THEMES } from "@/lib/themes";
import type {
  BarItem,
  EventSummary,
  MenuItem,
  ModerationPolicy,
  ModuleId,
  ScheduleItem,
  ThemeKey,
} from "@/lib/types";
import { salvarEditor } from "./actions";

const MODERATION_OPTIONS: { value: ModerationPolicy; label: string; hint: string }[] = [
  {
    value: "previa",
    label: "Aprovação prévia",
    hint: "Fotos e recados só aparecem depois que você aprovar.",
  },
  {
    value: "imediata",
    label: "Publicação imediata",
    hint: "Aparecem na hora; você pode ocultar depois.",
  },
];

/** ISO → valor de `<input type="datetime-local">`; ausente vira campo vazio. */
function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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
  { id: "cardapio", label: "Cardápio" },
  { id: "bar", label: "Bar" },
  { id: "amigo-secreto", label: "Amigo secreto" },
];

/**
 * Etapas sugeridas no dropdown do cardápio. O anfitrião pode escolher uma
 * destas ou digitar uma nova (o campo é um combobox: aceita valor livre).
 */
const CURSO_SUGESTOES = [
  "Entrada",
  "Prato principal",
  "Acompanhamento",
  "Sobremesa",
  "Bebida",
] as const;

export function EditorForm({ event }: { event: EventSummary }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>(event.themeKey);
  const [hosts, setHosts] = useState(event.hosts);
  const [eyebrow, setEyebrow] = useState(event.eyebrow);
  const [welcome, setWelcome] = useState(event.welcome);
  const [venue, setVenue] = useState(event.venue);
  const [city, setCity] = useState(event.city);
  const [address, setAddress] = useState(event.address ?? "");
  const [postalCode, setPostalCode] = useState(event.postalCode ?? "");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(event.schedule);
  const [menu, setMenu] = useState<MenuItem[]>(event.menu);
  /** Sugestões + etapas já usadas neste cardápio, sem repetição (case-insensitive). */
  const cursoOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of [...CURSO_SUGESTOES, ...menu.map((m) => m.course)]) {
      const value = raw.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
    return out;
  }, [menu]);
  const [bar, setBar] = useState<BarItem[]>(event.bar.items);
  const [barService, setBarService] = useState(event.bar.service ?? "");
  const [barSignatureName, setBarSignatureName] = useState(event.bar.signatureName ?? "");
  const [barSignatureDesc, setBarSignatureDesc] = useState(event.bar.signatureDesc ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(toDatetimeLocal(event.rsvpDeadline));
  const [moderationPolicy, setModerationPolicy] = useState<ModerationPolicy>(
    event.moderationPolicy,
  );
  const [modules, setModules] = useState<Record<string, boolean>>(
    Object.fromEntries(MODULE_OPTIONS.map((m) => [m.id, event.modules.includes(m.id)])),
  );
  const [secretSantaBudget, setSecretSantaBudget] = useState(event.secretSanta.budget ?? "");
  const [secretSantaDrawDate, setSecretSantaDrawDate] = useState(event.secretSanta.drawDate ?? "");
  const [secretSantaExchangeDate, setSecretSantaExchangeDate] = useState(
    event.secretSanta.exchangeDate ?? "",
  );
  const [secretSantaRules, setSecretSantaRules] = useState(event.secretSanta.rules ?? "");
  const [coverUrl, setCoverUrl] = useState(event.coverUrl);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleCoverSelected(file: File) {
    setCoverUploading(true);
    setCoverError(null);
    // Prévia imediata enquanto o upload acontece em segundo plano.
    setCoverUrl(URL.createObjectURL(file));

    try {
      const uploadRes = await fetch(`/api/eventos/${event.slug}/capa/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });
      const uploadBody = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok) {
        setCoverError(uploadBody?.error ?? "Não foi possível preparar o envio.");
        return;
      }

      const { path, signedUrl } = uploadBody.data as { path: string; signedUrl: string };

      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        setCoverError("Não foi possível enviar o arquivo.");
        return;
      }

      const confirmRes = await fetch(`/api/eventos/${event.slug}/capa`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: path }),
      });
      const confirmBody = await confirmRes.json().catch(() => null);
      if (!confirmRes.ok) {
        setCoverError(confirmBody?.error ?? "Não foi possível salvar a capa.");
        return;
      }
    } finally {
      setCoverUploading(false);
    }
  }

  /**
   * Consulta o CEP no ViaCEP e preenche endereço e cidade. É um atalho: o
   * anfitrião pode ignorar e digitar tudo à mão. Falha de rede não trava o
   * formulário — só some o aviso de "buscando".
   */
  async function lookupCep(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!res.ok || data?.erro) {
        setCepError("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }
      const linha = [data.logradouro, data.bairro].filter(Boolean).join(", ");
      if (linha) setAddress(linha);
      if (data.localidade) {
        setCity(data.uf ? `${data.localidade} - ${data.uf}` : data.localidade);
      }
    } catch {
      setCepError("Não foi possível consultar o CEP agora.");
    } finally {
      setCepLoading(false);
    }
  }

  const theme = THEMES[themeKey];

  /**
   * Evento sintético que reflete o estado atual do formulário, para alimentar
   * a mesma <EventPage> que o convidado vê. Assim a pré-visualização mostra
   * todas as seções ativas (cronograma, local, presentes, galeria, cardápio,
   * bar, amigo secreto) exatamente como ficarão na página publicada.
   */
  const previewEvent: EventSummary = useMemo(
    () => ({
      ...event,
      hosts,
      eyebrow,
      welcome,
      venue,
      city,
      address: address || undefined,
      postalCode: postalCode || undefined,
      themeKey,
      moderationPolicy,
      coverUrl: coverUrl || undefined,
      modules: [
        "rsvp",
        ...MODULE_OPTIONS.filter((m) => modules[m.id]).map((m) => m.id),
      ] as ModuleId[],
      schedule: schedule.filter((item) => item.time.trim() && item.title.trim()),
      menu: menu.filter((item) => item.course.trim() && item.name.trim()),
      bar: {
        service: barService || undefined,
        signatureName: barSignatureName || undefined,
        signatureDesc: barSignatureDesc || undefined,
        items: bar.filter((item) => item.name.trim()),
      },
      secretSanta: {
        budget: secretSantaBudget || undefined,
        drawDate: secretSantaDrawDate || undefined,
        exchangeDate: secretSantaExchangeDate || undefined,
        rules: secretSantaRules || undefined,
      },
    }),
    [
      event,
      hosts,
      eyebrow,
      welcome,
      venue,
      city,
      address,
      postalCode,
      themeKey,
      moderationPolicy,
      coverUrl,
      modules,
      schedule,
      menu,
      bar,
      barService,
      barSignatureName,
      barSignatureDesc,
      secretSantaBudget,
      secretSantaDrawDate,
      secretSantaExchangeDate,
      secretSantaRules,
    ],
  );

  const salvar = () => {
    setError(null);
    startTransition(async () => {
      const result = await salvarEditor({
        eventId: event.id,
        content: {
          hosts,
          eyebrow,
          welcome,
          venue,
          city,
          address,
          postalCode,
          themeKey,
          rsvpDeadline,
          moderationPolicy,
          secretSantaBudget,
          secretSantaDrawDate,
          secretSantaExchangeDate,
          secretSantaRules,
          barService,
          barSignatureName,
          barSignatureDesc,
        },
        modules: [
          "rsvp",
          ...MODULE_OPTIONS.filter((m) => modules[m.id]).map((m) => m.id),
        ],
        schedule: schedule.filter((item) => item.time.trim() && item.title.trim()),
        menu: menu.filter((item) => item.course.trim() && item.name.trim()),
        bar: bar.filter((item) => item.name.trim()),
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

  const patchMenu = (index: number, patch: Partial<MenuItem>) =>
    setMenu((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const patchBar = (index: number, patch: Partial<BarItem>) =>
    setBar((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

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
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- prévia local/URL assinada de curta duração.
                <img src={coverUrl} alt="Capa" className="h-full w-full object-cover" />
              ) : (
                <ImageSlot placeholder="Capa" compact />
              )}
            </div>
            <div className="flex-1">
              <Button
                size="sm"
                variant="outline"
                disabled={coverUploading}
                onClick={() => coverInput.current?.click()}
              >
                {coverUploading ? "Enviando..." : coverUrl ? "Trocar capa" : "Enviar capa"}
              </Button>
              <input
                ref={coverInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void handleCoverSelected(file);
                }}
              />
              {coverError && <p className="mt-1.5 text-[12px] text-danger">{coverError}</p>}
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
            <SmallField label="CEP">
              <Input
                value={postalCode}
                inputMode="numeric"
                placeholder="00000-000"
                onChange={(e) => setPostalCode(e.target.value)}
                onBlur={(e) => void lookupCep(e.target.value)}
                className="px-3.5 py-2.5 text-sm"
              />
            </SmallField>
            <SmallField label="Endereço">
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro"
                className="min-h-16 resize-none px-3.5 py-2.5 text-sm"
              />
            </SmallField>
            <p className="text-[12px] leading-relaxed text-ink-faint">
              {cepLoading
                ? "Buscando endereço pelo CEP…"
                : cepError
                  ? cepError
                  : "O CEP preenche o endereço e a cidade. O endereço posiciona o mapa na seção “Local e mapa”."}
            </p>
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

        {/* RSVP */}
        <Group title="Confirmação de presença">
          <div className="flex flex-col gap-3.5">
            <SmallField label="Prazo para responder (opcional)">
              <input
                type="datetime-local"
                value={rsvpDeadline}
                onChange={(e) => setRsvpDeadline(e.target.value)}
                className="w-full rounded-[10px] border border-line-strong bg-white px-3.5 py-2.5 text-sm"
              />
            </SmallField>
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Para aceitar RSVP de quem não está na lista, ative o{" "}
              <strong>link de auto-cadastro</strong> em Convidados.
            </p>
          </div>
        </Group>

        {/* Moderação */}
        <Group title="Moderação de galeria e mural">
          <div className="flex flex-col gap-2.5">
            {MODERATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setModerationPolicy(opt.value)}
                className={`cursor-pointer rounded-[10px] border px-3.5 py-3 text-left ${
                  moderationPolicy === opt.value
                    ? "border-accent bg-paper-2"
                    : "border-[rgba(42,39,36,0.15)] bg-white"
                }`}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="mt-0.5 text-[12.5px] text-ink-soft">{opt.hint}</div>
              </button>
            ))}
          </div>
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

        {/* Cardápio */}
        {modules["cardapio"] && (
          <Group title="Cardápio">
            <datalist id="cardapio-cursos">
              {cursoOptions.map((curso) => (
                <option key={curso} value={curso} />
              ))}
            </datalist>
            <div className="flex flex-col gap-3">
              {menu.map((item, index) => (
                <div
                  key={index}
                  className="rounded-[10px] border border-[rgba(42,39,36,0.15)] bg-white p-3"
                >
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={item.course}
                      onChange={(e) => patchMenu(index, { course: e.target.value })}
                      list="cardapio-cursos"
                      placeholder="Etapa"
                      aria-label="Etapa"
                      className="px-3 py-2 text-sm sm:w-36 sm:shrink-0"
                    />
                    <Input
                      value={item.name}
                      onChange={(e) => patchMenu(index, { name: e.target.value })}
                      placeholder="Carpaccio de abobrinha"
                      aria-label="Prato"
                      className="min-w-0 flex-1 px-3 py-2 text-sm"
                    />
                  </div>
                  <Input
                    value={item.desc}
                    onChange={(e) => patchMenu(index, { desc: e.target.value })}
                    placeholder="Detalhe (opcional)"
                    aria-label="Descrição"
                    className="px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => setMenu((items) => items.filter((_, i) => i !== index))}
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
                  setMenu((items) => [...items, { course: "", name: "", desc: "" }])
                }
              >
                Adicionar prato
              </Button>
            </div>
            <p className="mt-2.5 text-[12px] leading-relaxed text-ink-faint">
              Escolha uma etapa da lista ou digite uma nova. Os pratos aparecem
              agrupados pela etapa, na ordem desta lista.
            </p>
          </Group>
        )}

        {/* Bar */}
        {modules["bar"] && (
          <Group title="Bar">
            <div className="flex flex-col gap-3.5">
              <SmallField label="Serviço de bar (opcional)">
                <Input
                  value={barService}
                  onChange={(e) => setBarService(e.target.value)}
                  placeholder="Open bar a noite toda"
                  className="px-3.5 py-2.5 text-sm"
                />
              </SmallField>
              <SmallField label="Drink de assinatura — nome (opcional)">
                <Input
                  value={barSignatureName}
                  onChange={(e) => setBarSignatureName(e.target.value)}
                  placeholder="Flor de Itu"
                  className="px-3.5 py-2.5 text-sm"
                />
              </SmallField>
              <SmallField label="Drink de assinatura — descrição (opcional)">
                <Textarea
                  value={barSignatureDesc}
                  onChange={(e) => setBarSignatureDesc(e.target.value)}
                  className="min-h-16 resize-none px-3.5 py-2.5 text-sm"
                />
              </SmallField>
            </div>

            <div className="mt-3.5 flex flex-col gap-3">
              {bar.map((item, index) => (
                <div
                  key={index}
                  className="rounded-[10px] border border-[rgba(42,39,36,0.15)] bg-white p-3"
                >
                  <Input
                    value={item.name}
                    onChange={(e) => patchBar(index, { name: e.target.value })}
                    placeholder="Gin tônica"
                    aria-label="Bebida"
                    className="mb-2 px-3 py-2 text-sm"
                  />
                  <Input
                    value={item.desc}
                    onChange={(e) => patchBar(index, { desc: e.target.value })}
                    placeholder="Detalhe (opcional)"
                    aria-label="Descrição"
                    className="px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => setBar((items) => items.filter((_, i) => i !== index))}
                    className="mt-2 cursor-pointer text-[12.5px] font-semibold text-danger"
                  >
                    Remover
                  </button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setBar((items) => [...items, { name: "", desc: "" }])}
              >
                Adicionar bebida
              </Button>
            </div>
            <p className="mt-2.5 text-[12px] leading-relaxed text-ink-faint">
              Serviço, drink de assinatura e carta de bebidas — tudo opcional.
            </p>
          </Group>
        )}

        {/* Amigo secreto */}
        {modules["amigo-secreto"] && (
          <Group title="Amigo secreto">
            <div className="flex flex-col gap-3.5">
              <SmallField label="Valor sugerido (opcional)">
                <Input
                  value={secretSantaBudget}
                  onChange={(e) => setSecretSantaBudget(e.target.value)}
                  placeholder="R$ 80"
                  className="px-3.5 py-2.5 text-sm"
                />
              </SmallField>
              <SmallField label="Data do sorteio (opcional)">
                <input
                  type="date"
                  value={secretSantaDrawDate}
                  onChange={(e) => setSecretSantaDrawDate(e.target.value)}
                  className="w-full rounded-[10px] border border-line-strong bg-white px-3.5 py-2.5 text-sm"
                />
              </SmallField>
              <SmallField label="Data da troca (opcional)">
                <input
                  type="date"
                  value={secretSantaExchangeDate}
                  onChange={(e) => setSecretSantaExchangeDate(e.target.value)}
                  className="w-full rounded-[10px] border border-line-strong bg-white px-3.5 py-2.5 text-sm"
                />
              </SmallField>
              <SmallField label="Regras (opcional)">
                <Textarea
                  value={secretSantaRules}
                  onChange={(e) => setSecretSantaRules(e.target.value)}
                  className="min-h-20 resize-none px-3.5 py-2.5 text-sm"
                />
              </SmallField>
            </div>
            <p className="mt-2.5 text-[12px] leading-relaxed text-ink-faint">
              Tudo aqui é opcional — sem preencher, o convidado só não vê a sugestão dos
              anfitriões na tela de participação.
            </p>
          </Group>
        )}

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
      <main className="flex flex-1 flex-col bg-paper-3 px-4 py-8 sm:px-8 lg:h-[calc(100vh-57px)] lg:overflow-hidden">
        <div className="mb-4 shrink-0 text-center text-[13px] uppercase tracking-wider text-ink-soft">
          Pré-visualização ao vivo — página completa do convidado
        </div>

        <div className="h-[70vh] shrink-0 overflow-hidden rounded-[20px] border border-line bg-paper shadow-[0_20px_60px_rgba(0,0,0,0.12)] lg:h-auto lg:min-h-0 lg:flex-1">
          {/* onClickCapture neutraliza a navegação: os links internos da
              EventPage (ver lista completa, enviar fotos…) sairiam do editor
              e descartariam as alterações não salvas. Os botões (Confirmar
              Presença, Participar do sorteio) continuam ativos. */}
          <div
            className="h-full overflow-y-auto"
            onClickCapture={(e) => {
              const anchor = (e.target as HTMLElement).closest("a");
              if (anchor) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <EventPage event={previewEvent} />
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
