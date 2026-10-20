"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageSlot } from "@/components/ImageSlot";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  LinkButton,
  Sheet,
  Stepper,
  Textarea,
} from "@/components/ui";
import { totalSlots } from "@/lib/raffle-slots";
import type { Guest, Raffle, RaffleParticipantMode, RafflePrize, RsvpStatus } from "@/lib/types";
import { uploadEventImage } from "@/lib/upload-event-image";
import { RAFFLE_STATUS_LABEL, RAFFLE_STATUS_TONE } from "../RaffleList";

type EventLite = { slug: string; title: string };

async function send(url: string, method: string, body?: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.error ?? "Não foi possível concluir a ação.";
}

export function RaffleEditor({ event, raffleId }: { event: EventLite; raffleId: string }) {
  const router = useRouter();
  const base = `/api/eventos/${event.slug}/sorteios/${raffleId}`;
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(base);
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    setRaffle(body.data);
  }, [base]);

  useEffect(() => {
    let cancelled = false;
    fetch(base)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) setNotFound(true);
        else setRaffle(body.data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [base]);

  async function act(acao: "reabrir" | "recomecar", confirmText: string) {
    if (!confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    const err = await send(`${base}/estado`, "POST", { acao });
    setBusy(false);
    if (err) setError(err);
    await load();
  }

  async function removeRaffle() {
    if (!raffle) return;
    if (!confirm(`Excluir o sorteio "${raffle.title}"? Prêmios, participantes e resultados serão apagados.`))
      return;
    const err = await send(base, "DELETE");
    if (err) setError(err);
    else router.push("/painel/sorteios");
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <EmptyState title="Sorteio não encontrado" desc="Ele pode ter sido excluído." />
        <div className="mt-6 text-center">
          <LinkButton href="/painel/sorteios" variant="outline">
            Voltar aos sorteios
          </LinkButton>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-10 text-[15px] text-ink-faint">
        Carregando sorteio…
      </div>
    );
  }

  const locked = raffle.status !== "aberto";
  const hasResults = raffle.results.length > 0;
  const slots = totalSlots(raffle);
  // Num modo automático aberto, `participantCount` é a prévia de convidados elegíveis.
  const ready = raffle.prizes.length > 0 && raffle.participantCount > 0;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 pb-16">
      <Link href="/painel/sorteios" className="text-[13px] text-ink-soft no-underline hover:text-ink">
        ← Sorteios
      </Link>

      {/* Cabeçalho ---------------------------------------------------- */}
      <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">{event.title}</div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[30px] font-semibold leading-tight">{raffle.title}</h1>
            <Badge tone={RAFFLE_STATUS_TONE[raffle.status]}>{RAFFLE_STATUS_LABEL[raffle.status]}</Badge>
          </div>
          {raffle.description && (
            <p className="mt-1.5 text-[14px] text-ink-soft">{raffle.description}</p>
          )}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="cursor-pointer text-[13px] font-semibold text-accent-strong hover:underline"
            >
              Editar nome
            </button>
            <button
              type="button"
              onClick={removeRaffle}
              className="cursor-pointer text-[13px] font-semibold text-danger hover:underline"
            >
              Excluir sorteio
            </button>
          </div>
        </div>
      </div>

      {/* Chamada para o palco --------------------------------------- */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-[20px] bg-ink px-8 py-7">
        <div className="max-w-[560px]">
          <div className="mb-1.5 text-[13px] uppercase tracking-wider text-accent-soft">
            Na hora da festa
          </div>
          <div className="font-display text-[22px] text-paper">
            {raffle.status === "encerrado"
              ? "Sorteio encerrado — reveja os ganhadores no palco."
              : raffle.status === "em_andamento"
                ? "Sorteio em andamento — volte ao palco para continuar."
                : "Abra a tela do sorteio, projete ou compartilhe a tela e clique em Começar."}
          </div>
          <div className="mt-2 text-[13px] text-accent-soft">
            {ready
              ? `${raffle.participantCount} participante(s) concorrendo a ${slots - raffle.alternatesCount} prêmio(s)${raffle.alternatesCount > 0 ? ` + ${raffle.alternatesCount} suplente(s)` : ""}. Ao começar, a lista de participantes é bloqueada.`
              : raffle.prizes.length === 0
                ? "Cadastre pelo menos um prêmio para liberar o sorteio."
                : raffle.participantMode === "selecionados"
                  ? "Selecione os participantes para liberar o sorteio."
                  : "Nenhum convidado se encaixa no modo de participação escolhido ainda."}
          </div>
        </div>
        {ready ? (
          <LinkButton href={`/painel/sorteios/${raffle.id}/palco`} size="lg" className="btn-sheen">
            {raffle.status === "aberto" ? "Abrir tela do sorteio" : "Ir para o palco"}
          </LinkButton>
        ) : (
          <Button size="lg" disabled>
            Abrir tela do sorteio
          </Button>
        )}
      </div>

      {/* Banner de bloqueio ----------------------------------------- */}
      {locked && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(181,138,43,0.35)] bg-[rgba(181,138,43,0.08)] px-6 py-4">
          <div>
            <div className="text-[14.5px] font-semibold">
              {raffle.status === "encerrado"
                ? "Sorteio encerrado."
                : "Inscrições bloqueadas — o sorteio já começou."}
            </div>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {hasResults
                ? "Para alterar prêmios ou participantes, recomece o sorteio do zero (os resultados serão descartados)."
                : "Nenhum nome foi sorteado ainda — você pode reabrir as inscrições para alterar a lista."}
            </p>
          </div>
          {hasResults ? (
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() =>
                act(
                  "recomecar",
                  "Recomeçar do zero? Todos os nomes já sorteados serão descartados e as inscrições reabertas.",
                )
              }
            >
              Recomeçar do zero
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => act("reabrir", "Reabrir as inscrições deste sorteio?")}
            >
              Reabrir inscrições
            </Button>
          )}
        </div>
      )}

      {error && <p className="mb-4 text-[14px] text-danger">{error}</p>}

      {hasResults && <ResultsCard raffle={raffle} />}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
        <PrizesCard raffle={raffle} base={base} eventSlug={event.slug} locked={locked} onChanged={load} />
        <ParticipantsCard
          raffle={raffle}
          base={base}
          eventSlug={event.slug}
          locked={locked}
          onChanged={load}
        />
      </div>

      {editOpen && (
        <EditRaffleSheet
          raffle={raffle}
          base={base}
          onClose={() => setEditOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cartão de seção                                                     */
/* ------------------------------------------------------------------ */

function StepCard({
  step,
  title,
  desc,
  action,
  children,
}: {
  step: number;
  title: string;
  desc: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] bg-paper p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-[16px] font-semibold text-on-accent">
            {step}
          </span>
          <div>
            <h2 className="font-display text-[20px] font-semibold leading-tight">{title}</h2>
            <p className="mt-0.5 text-[13px] text-ink-soft">{desc}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Prêmios                                                             */
/* ------------------------------------------------------------------ */

function PrizesCard({
  raffle,
  base,
  eventSlug,
  locked,
  onChanged,
}: {
  raffle: Raffle;
  base: string;
  eventSlug: string;
  locked: boolean;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<RafflePrize | "novo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alternates, setAlternates] = useState(raffle.alternatesCount);

  // Mantém o stepper em sincronia quando o sorteio é recarregado.
  const [syncedAlternates, setSyncedAlternates] = useState(raffle.alternatesCount);
  if (syncedAlternates !== raffle.alternatesCount) {
    setSyncedAlternates(raffle.alternatesCount);
    setAlternates(raffle.alternatesCount);
  }

  const winners = raffle.prizes.reduce((acc, p) => acc + p.quantity, 0);

  async function move(index: number, delta: number) {
    const ids = raffle.prizes.map((p) => p.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setError(await send(`${base}/premios`, "PUT", { ids }));
    await onChanged();
  }

  async function remove(prize: RafflePrize) {
    if (!confirm(`Remover o prêmio "${prize.name}"?`)) return;
    setError(await send(`${base}/premios/${prize.id}`, "DELETE"));
    await onChanged();
  }

  async function saveAlternates(value: number) {
    setAlternates(value);
    setError(await send(base, "PATCH", { alternatesCount: value }));
    await onChanged();
  }

  return (
    <StepCard
      step={1}
      title="Prêmios"
      desc="Sorteados na ordem da lista — deixe o prêmio principal por último."
      action={
        !locked && (
          <Button size="sm" onClick={() => setEditing("novo")}>
            Adicionar
          </Button>
        )
      }
    >
      {raffle.prizes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong px-5 py-8 text-center text-[14px] text-ink-soft">
          Nenhum prêmio ainda. Adicione o que será sorteado e quantas pessoas ganham cada um.
        </div>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {raffle.prizes.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-paper-2 p-3">
              <span className="w-6 shrink-0 text-center font-display text-[18px] font-semibold text-accent-strong">
                {i + 1}
              </span>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL assinada de curta duração.
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <ImageSlot placeholder="" compact />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{p.name}</div>
                <div className="text-[12.5px] text-ink-soft">
                  {p.quantity === 1 ? "1 vencedor" : `${p.quantity} vencedores`}
                  {i === raffle.prizes.length - 1 && raffle.prizes.length > 1 ? " · grande final" : ""}
                </div>
              </div>
              {!locked && (
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </IconButton>
                  <IconButton
                    label="Descer"
                    disabled={i === raffle.prizes.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </IconButton>
                  <IconButton label="Editar" onClick={() => setEditing(p)}>
                    ✎
                  </IconButton>
                  <IconButton label="Remover" onClick={() => remove(p)} danger>
                    ×
                  </IconButton>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line p-4">
        <div>
          <div className="text-[14px] font-semibold">Suplentes</div>
          <p className="mt-0.5 max-w-[280px] text-[12.5px] text-ink-soft">
            Nomes reserva sorteados no final, caso algum ganhador não apareça.
          </p>
        </div>
        {locked ? (
          <span className="font-display text-[22px] font-semibold">{raffle.alternatesCount}</span>
        ) : (
          <Stepper value={alternates} onChange={saveAlternates} min={0} max={50} />
        )}
      </div>

      <p className="mt-4 text-[13px] text-ink-soft">
        Total: <strong>{winners}</strong> vencedor(es)
        {raffle.alternatesCount > 0 && (
          <>
            {" "}
            + <strong>{raffle.alternatesCount}</strong> suplente(s)
          </>
        )}{" "}
        = <strong>{winners + raffle.alternatesCount}</strong> nome(s) sorteado(s).
      </p>
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}

      {editing && (
        <PrizeSheet
          key={editing === "novo" ? "novo" : editing.id}
          prize={editing === "novo" ? null : editing}
          base={base}
          eventSlug={eventSlug}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      )}
    </StepCard>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`h-8 w-8 cursor-pointer rounded-lg text-[15px] leading-none transition hover:bg-[rgba(42,39,36,0.08)] disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? "text-danger" : "text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}

function PrizeSheet({
  prize,
  base,
  eventSlug,
  onClose,
  onSaved,
}: {
  prize: RafflePrize | null;
  base: string;
  eventSlug: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(prize?.name ?? "");
  const [description, setDescription] = useState(prize?.description ?? "");
  const [quantity, setQuantity] = useState(prize?.quantity ?? 1);
  // `undefined` = não mexeu na foto; string = nova; null = remover.
  const [imagePath, setImagePath] = useState<string | null | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(prize?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File) {
    setUploading(true);
    setError(null);
    try {
      const path = await uploadEventImage(eventSlug, file);
      setImagePath(path);
      setPreview(URL.createObjectURL(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const err = prize
      ? await send(`${base}/premios/${prize.id}`, "PATCH", {
          name,
          description: description.trim(),
          quantity,
          imagePath,
        })
      : await send(`${base}/premios`, "POST", {
          name,
          description: description.trim() || undefined,
          quantity,
          imagePath: imagePath ?? undefined,
        });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    await onSaved();
    onClose();
  }

  return (
    <Sheet open onClose={onClose} maxWidth={440}>
      <div className="mb-5 font-display text-[22px] font-semibold">
        {prize ? "Editar prêmio" : "Adicionar prêmio"}
      </div>
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-3 rounded-xl bg-paper-2 p-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- prévia local/URL assinada.
              <img src={preview} alt="Foto do prêmio" className="h-full w-full object-cover" />
            ) : (
              <ImageSlot placeholder="Foto" compact />
            )}
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={uploading} onClick={() => input.current?.click()}>
              {uploading ? "Enviando..." : preview ? "Trocar foto" : "Enviar foto (opcional)"}
            </Button>
            {preview && !uploading && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setImagePath(null);
                  setPreview(null);
                }}
              >
                Remover
              </Button>
            )}
          </div>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void pick(file);
            }}
          />
        </div>
        <Field label="Prêmio">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kit spa para dois"
            autoFocus
          />
        </Field>
        <Field label="Detalhes (opcional)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cortesia da Villa Glam"
            className="min-h-16"
          />
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-paper-2 p-3.5">
          <div>
            <div className="text-[14px] font-semibold">Quantos ganham este prêmio?</div>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">Cada vencedor é sorteado separadamente.</p>
          </div>
          <Stepper value={quantity} onChange={setQuantity} min={1} max={100} />
        </div>
      </div>
      {error && <p className="mt-3 text-[13.5px] text-danger">{error}</p>}
      <div className="mt-6 flex gap-2.5">
        <Button variant="outline" full onClick={onClose}>
          Cancelar
        </Button>
        <Button full disabled={saving || uploading || !name.trim()} onClick={submit}>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Participantes                                                       */
/* ------------------------------------------------------------------ */

type Filter = "todos" | RsvpStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "confirmado", label: "Confirmados" },
  { id: "pendente", label: "Pendentes" },
  { id: "recusado", label: "Recusados" },
];

const RSVP_LABEL: Record<RsvpStatus, string> = {
  confirmado: "Confirmado",
  pendente: "Pendente",
  recusado: "Recusou",
};

const MODES: { id: RaffleParticipantMode; title: string; desc: string }[] = [
  {
    id: "todos",
    title: "Todos os convidados",
    desc: "Toda a lista de convidados concorre.",
  },
  {
    id: "confirmados",
    title: "Só os confirmados",
    desc: "Quem confirmou presença no RSVP.",
  },
  {
    id: "selecionados",
    title: "Escolher na lista",
    desc: "Você marca quem concorre.",
  },
];

function ModePicker({
  value,
  onChange,
  disabled,
}: {
  value: RaffleParticipantMode;
  onChange: (mode: RaffleParticipantMode) => void;
  disabled: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Quem participa" className="mb-5 grid gap-2 sm:grid-cols-3">
      {MODES.map((m) => {
        const active = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => !active && onChange(m.id)}
            className={`cursor-pointer rounded-xl border p-3 text-left transition disabled:cursor-wait ${
              active
                ? "border-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] shadow-[inset_0_0_0_1px_var(--accent)]"
                : "border-line-strong hover:bg-paper-2"
            }`}
          >
            <span className="flex items-center gap-2 text-[14px] font-semibold">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? "border-accent" : "border-line-strong"
                }`}
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              </span>
              {m.title}
            </span>
            <span className="mt-1 block text-[12.5px] leading-snug text-ink-soft">{m.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Prévia dos modos automáticos: quem entraria se o sorteio começasse agora. */
function AutoPreview({ guests, mode }: { guests: Guest[]; mode: "todos" | "confirmados" }) {
  const eligible = mode === "todos" ? guests : guests.filter((g) => g.status === "confirmado");
  return (
    <div>
      <div className="rounded-xl border border-line bg-paper-2 p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[30px] font-semibold leading-none">{eligible.length}</span>
          <span className="text-[14px] text-ink-soft">
            {eligible.length === 1 ? "convidado participa" : "convidados participam"} hoje
          </span>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
          A lista é montada automaticamente quando você clicar em <strong>Começar o sorteio</strong>:
          {mode === "todos"
            ? " quem for cadastrado até lá também entra. Inclui quem ainda não respondeu e quem recusou o convite."
            : " quem confirmar presença até lá também entra."}
        </p>
      </div>
      {eligible.length > 0 && (
        <ul className="no-scrollbar mt-3 flex max-h-[340px] flex-col gap-0.5 overflow-y-auto rounded-xl border border-line p-1.5">
          {eligible.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[14px]">
              <span className="min-w-0 truncate">{g.name}</span>
              <span className="shrink-0 text-[12px] text-ink-faint">{RSVP_LABEL[g.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ParticipantsCard({
  raffle,
  base,
  eventSlug,
  locked,
  onChanged,
}: {
  raffle: Raffle;
  base: string;
  eventSlug: string;
  locked: boolean;
  onChanged: () => Promise<void>;
}) {
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const savedIds = useMemo(
    () => new Set(raffle.participants.map((p) => p.guestId).filter((id): id is string => !!id)),
    [raffle.participants],
  );
  const [selected, setSelected] = useState<Set<string>>(savedIds);
  const [synced, setSynced] = useState(savedIds);
  if (synced !== savedIds) {
    setSynced(savedIds);
    setSelected(new Set(savedIds));
  }
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mode = raffle.participantMode;

  async function changeMode(next: RaffleParticipantMode) {
    if (mode === "selecionados" && dirty && !confirm("Descartar as marcações que ainda não foram salvas?")) return;
    setSaving(true);
    setError(await send(base, "PATCH", { participantMode: next }));
    setSaving(false);
    await onChanged();
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/eventos/${eventSlug}/convidados`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) setGuests(body?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setGuests([]);
      });
    return () => {
      cancelled = true;
    };
  }, [eventSlug]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return (guests ?? []).filter(
      (g) =>
        (filter === "todos" || g.status === filter) &&
        (!q || g.name.toLocaleLowerCase("pt-BR").includes(q) || g.group.toLocaleLowerCase("pt-BR").includes(q)),
    );
  }, [guests, filter, query]);

  const dirty =
    selected.size !== savedIds.size || [...selected].some((id) => !savedIds.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible(on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const g of visible) {
        if (on) next.add(g.id);
        else next.delete(g.id);
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(await send(`${base}/participantes`, "PUT", { guestIds: [...selected] }));
    setSaving(false);
    await onChanged();
  }

  if (locked) {
    return (
      <StepCard
        step={2}
        title="Participantes"
        desc={`${raffle.participants.length} concorrendo · lista bloqueada durante o sorteio.`}
      >
        <ul className="no-scrollbar flex max-h-[460px] flex-col gap-1 overflow-y-auto">
          {raffle.participants.map((p) => {
            const result = raffle.results.find((r) => r.participantId === p.id);
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[14px] odd:bg-paper-2"
              >
                <span className={result?.status === "ausente" ? "text-ink-faint line-through" : ""}>
                  {p.name}
                </span>
                {result && (
                  <Badge tone={result.status === "ausente" ? "neutral" : "ok"}>
                    {result.status === "ausente" ? "Ausente" : "Sorteado"}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </StepCard>
    );
  }

  const allVisibleSelected = visible.length > 0 && visible.every((g) => selected.has(g.id));

  return (
    <StepCard
      step={2}
      title="Participantes"
      desc={
        mode === "selecionados"
          ? "Marque na lista de convidados quem concorre neste sorteio."
          : "Quem participa é definido pela lista de convidados, sem marcar ninguém."
      }
    >
      <ModePicker value={mode} onChange={changeMode} disabled={saving} />
      {guests === null ? (
        <p className="text-[14px] text-ink-faint">Carregando convidados…</p>
      ) : guests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong px-5 py-8 text-center text-[14px] text-ink-soft">
          Sua lista de convidados está vazia.{" "}
          <Link href="/painel/convidados" className="font-semibold text-accent-strong">
            Cadastrar convidados
          </Link>
        </div>
      ) : mode !== "selecionados" ? (
        <>
          <AutoPreview guests={guests} mode={mode} />
          {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
        </>
      ) : (
        <>
          <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  filter === f.id
                    ? "border-accent bg-accent text-on-accent"
                    : "border-line-strong text-ink-soft hover:bg-paper-2"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou grupo"
            className="mb-3 py-2.5 text-[14px]"
          />
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <button
              type="button"
              onClick={() => selectVisible(!allVisibleSelected)}
              disabled={visible.length === 0}
              className="cursor-pointer font-semibold text-accent-strong hover:underline disabled:opacity-40"
            >
              {allVisibleSelected ? "Desmarcar" : "Marcar"} {visible.length} da lista
            </button>
            <span className="text-ink-soft">{selected.size} selecionado(s)</span>
          </div>
          <ul className="no-scrollbar flex max-h-[420px] flex-col gap-0.5 overflow-y-auto rounded-xl border border-line p-1.5">
            {visible.length === 0 && (
              <li className="px-3 py-6 text-center text-[13.5px] text-ink-faint">
                Ninguém nesta lista.
              </li>
            )}
            {visible.map((g) => (
              <li key={g.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-paper-2">
                  <input
                    type="checkbox"
                    checked={selected.has(g.id)}
                    onChange={() => toggle(g.id)}
                    className="h-[18px] w-[18px] shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-medium">{g.name}</span>
                    {g.group && <span className="block truncate text-[12px] text-ink-faint">{g.group}</span>}
                  </span>
                  <span className="shrink-0 text-[12px] text-ink-faint">{RSVP_LABEL[g.status]}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[12.5px] text-ink-faint">
              {dirty ? "Alterações não salvas." : "Lista salva."}
            </span>
            <Button disabled={!dirty || saving} onClick={save}>
              {saving ? "Salvando…" : `Salvar ${selected.size} participante(s)`}
            </Button>
          </div>
          {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
        </>
      )}
    </StepCard>
  );
}

/* ------------------------------------------------------------------ */
/* Resultados                                                          */
/* ------------------------------------------------------------------ */

function ResultsCard({ raffle }: { raffle: Raffle }) {
  const prizeName = new Map(raffle.prizes.map((p) => [p.id, p.name]));
  return (
    <section className="mb-6 rounded-[20px] bg-paper p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
      <h2 className="mb-4 font-display text-[20px] font-semibold">Resultados</h2>
      <ol className="flex flex-col gap-1.5">
        {raffle.results.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2 text-[14px] odd:bg-paper-2"
          >
            <span className="w-6 font-display font-semibold text-accent-strong">{r.sequence}</span>
            <span className={`flex-1 font-semibold ${r.status === "ausente" ? "text-ink-faint line-through" : ""}`}>
              {r.name}
            </span>
            <span className="text-ink-soft">
              {r.prizeId ? prizeName.get(r.prizeId) : "Suplente"}
            </span>
            {r.status === "ausente" && <Badge>Ausente</Badge>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Editar nome/descrição                                               */
/* ------------------------------------------------------------------ */

function EditRaffleSheet({
  raffle,
  base,
  onClose,
  onSaved,
}: {
  raffle: Raffle;
  base: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(raffle.title);
  const [description, setDescription] = useState(raffle.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    const err = await send(base, "PATCH", { title, description: description.trim() });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    await onSaved();
    onClose();
  }

  return (
    <Sheet open onClose={onClose} maxWidth={440}>
      <div className="mb-5 font-display text-[22px] font-semibold">Editar sorteio</div>
      <div className="flex flex-col gap-3.5">
        <Field label="Nome do sorteio">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Descrição (opcional)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20"
          />
        </Field>
      </div>
      {error && <p className="mt-3 text-[13.5px] text-danger">{error}</p>}
      <div className="mt-6 flex gap-2.5">
        <Button variant="outline" full onClick={onClose}>
          Cancelar
        </Button>
        <Button full disabled={saving || !title.trim()} onClick={submit}>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </Sheet>
  );
}
