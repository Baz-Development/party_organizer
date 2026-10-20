"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Button, EmptyState, Field, Input, Sheet, Textarea } from "@/components/ui";
import type { RaffleStatus, RaffleSummary } from "@/lib/types";

type EventLite = { slug: string; title: string };

export const RAFFLE_STATUS_LABEL: Record<RaffleStatus, string> = {
  aberto: "Em preparação",
  em_andamento: "Em andamento",
  encerrado: "Encerrado",
};

export const RAFFLE_STATUS_TONE: Record<RaffleStatus, "neutral" | "warn" | "ok"> = {
  aberto: "neutral",
  em_andamento: "warn",
  encerrado: "ok",
};

export function RaffleList({ event }: { event: EventLite }) {
  const [raffles, setRaffles] = useState<RaffleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/eventos/${event.slug}/sorteios`)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError(body?.error ?? "Não foi possível carregar os sorteios.");
          setRaffles([]);
        } else setRaffles(body?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setRaffles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [event.slug]);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 pb-16">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">
            {event.title}
          </div>
          <h1 className="font-display text-[30px] font-semibold">Sorteios</h1>
          <p className="mt-1.5 max-w-[560px] text-[14px] text-ink-soft">
            Monte o sorteio em três passos — prêmios, participantes e apresentação. Na hora
            da festa, é só abrir a tela do sorteio e projetar.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Novo sorteio</Button>
      </div>

      {error && <p className="mb-4 text-[14px] text-danger">{error}</p>}

      {raffles === null ? (
        <p className="text-[15px] text-ink-faint">Carregando sorteios…</p>
      ) : raffles.length === 0 ? (
        <EmptyState
          title="Nenhum sorteio criado"
          desc="Crie um sorteio para escolher prêmios e participantes da lista de convidados."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {raffles.map((r) => (
            <Link
              key={r.id}
              href={`/painel/sorteios/${r.id}`}
              className="group rounded-2xl bg-paper p-6 text-ink no-underline shadow-[0_8px_28px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-display text-[20px] font-semibold leading-tight">
                  {r.title}
                </div>
                <Badge tone={RAFFLE_STATUS_TONE[r.status]}>{RAFFLE_STATUS_LABEL[r.status]}</Badge>
              </div>
              {r.description && (
                <p className="mt-1.5 line-clamp-2 text-[13.5px] text-ink-soft">{r.description}</p>
              )}
              <div className="mt-5 flex flex-wrap gap-6 text-[13px] text-ink-soft">
                <span>
                  <strong className="font-display text-[22px] text-ink">{r.participantCount}</strong>{" "}
                  participantes
                </span>
                <span>
                  <strong className="font-display text-[22px] text-ink">{r.winnerSlots}</strong>{" "}
                  vencedor(es)
                </span>
                {r.alternatesCount > 0 && (
                  <span>
                    <strong className="font-display text-[22px] text-ink">
                      {r.alternatesCount}
                    </strong>{" "}
                    suplente(s)
                  </span>
                )}
              </div>
              {r.status !== "aberto" && (
                <div className="mt-3 text-[12.5px] text-ink-faint">
                  {r.drawnCount} de {r.winnerSlots + r.alternatesCount} nomes sorteados
                </div>
              )}
              <div className="mt-4 text-[13px] font-semibold text-accent-strong group-hover:underline">
                Abrir →
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateRaffleSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        eventSlug={event.slug}
      />
    </div>
  );
}

function CreateRaffleSheet({
  open,
  onClose,
  eventSlug,
}: {
  open: boolean;
  onClose: () => void;
  eventSlug: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/eventos/${eventSlug}/sorteios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description.trim() || undefined }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setSaving(false);
      setError(body?.error ?? "Não foi possível criar o sorteio.");
      return;
    }
    router.push(`/painel/sorteios/${body.data.id}`);
  }

  return (
    <Sheet open={open} onClose={onClose} maxWidth={440}>
      <div className="mb-5 font-display text-[22px] font-semibold">Novo sorteio</div>
      <div className="flex flex-col gap-3.5">
        <Field label="Nome do sorteio" hint="Aparece em destaque na tela do sorteio.">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Grande sorteio da noite"
            autoFocus
          />
        </Field>
        <Field label="Descrição (opcional)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Entre os convidados presentes na festa"
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
          {saving ? "Criando…" : "Criar e configurar"}
        </Button>
      </div>
    </Sheet>
  );
}
