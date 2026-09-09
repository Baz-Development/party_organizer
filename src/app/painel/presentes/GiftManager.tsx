"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Field, Input, Sheet, Toggle } from "@/components/ui";
import { brl } from "@/lib/format";
import type { Gift, GiftStatus } from "@/lib/types";

const STATUS_LABEL: Record<GiftStatus, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  comprado: "Presenteado",
};

const STATUS_TONE: Record<GiftStatus, "neutral" | "warn" | "ok"> = {
  disponivel: "neutral",
  reservado: "warn",
  comprado: "ok",
};

type EventLite = { slug: string; title: string };

export function GiftManager({ event }: { event: EventLite }) {
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);

  const load = useCallback(() => {
    fetch(`/api/eventos/${event.slug}/presentes`)
      .then((res) => res.json())
      .then((body) => setGifts(body?.data ?? []))
      .catch(() => setGifts([]));
  }, [event.slug]);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/eventos/${event.slug}/presentes`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) setGifts(body?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setGifts([]);
      });

    // Um convidado pode reservar ou pagar enquanto esta aba fica aberta —
    // recarrega ao voltar o foco para refletir o estado real do catálogo.
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [event.slug, load]);

  async function remove(gift: Gift) {
    if (!confirm(`Remover "${gift.name}" da lista de presentes?`)) return;
    const res = await fetch(`/api/eventos/${event.slug}/presentes/${gift.id}`, {
      method: "DELETE",
    });
    if (res.ok) load();
    else {
      const body = await res.json().catch(() => null);
      alert(body?.error ?? "Não foi possível remover o presente.");
    }
  }

  const total = gifts?.length ?? 0;
  const presenteados =
    gifts?.filter((g) => g.status === "comprado").length ?? 0;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 pb-16">
      {/* Cabeçalho ---------------------------------------------------- */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">
            {event.title}
          </div>
          <h1 className="font-display text-[30px] font-semibold">
            Lista de presentes
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-soft">
            {total} no catálogo · {presenteados} já presenteado(s)
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>Adicionar presente</Button>
      </div>

      {/* Lista ------------------------------------------------------- */}
      {gifts === null ? (
        <p className="text-[15px] text-ink-faint">
          Carregando lista de presentes…
        </p>
      ) : gifts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
          <div className="font-display text-[19px] font-semibold">
            Nenhum presente cadastrado
          </div>
          <p className="mt-2 text-[14.5px] text-ink-soft">
            Adicione itens para que apareçam na página pública do evento.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {gifts.map((g) => {
            const pct = g.quota
              ? Math.min(
                  100,
                  Math.round((g.quota.raised / g.quota.target) * 100),
                )
              : 0;
            return (
              <div
                key={g.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl bg-paper p-5 shadow-[0_8px_28px_rgba(0,0,0,0.04)]"
              >
                <div className="min-w-[200px] flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold">{g.name}</span>
                    <Badge tone={STATUS_TONE[g.status]}>
                      {STATUS_LABEL[g.status]}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[13px] text-ink-soft">
                    {g.category}
                    {g.store ? ` · ${g.store}` : ""}
                  </div>
                  {g.note && (
                    <div className="mt-1 text-[13px] text-ink-faint">
                      {g.note}
                    </div>
                  )}
                  {g.reservedBy && (
                    <div className="mt-1 text-[13px] text-ink-soft">
                      {g.status === "comprado"
                        ? "Presenteado por"
                        : "Reservado por"}
                      : {g.reservedBy}
                    </div>
                  )}
                </div>

                <div className="min-w-[160px] text-right">
                  {g.quota ? (
                    <>
                      <div className="text-[14px] font-semibold">
                        {brl(g.quota.raised)}{" "}
                        <span className="font-normal text-ink-soft">
                          de {brl(g.quota.target)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[rgba(42,39,36,0.1)]">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-[15px] font-semibold">
                      {brl(g.price)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(g)}
                  >
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => remove(g)}>
                    Remover
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddGiftSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        eventSlug={event.slug}
        onSaved={load}
      />
      {editing && (
        <EditGiftSheet
          key={editing.id}
          gift={editing}
          onClose={() => setEditing(null)}
          eventSlug={event.slug}
          onSaved={load}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Adicionar                                                           */
/* ------------------------------------------------------------------ */

function AddGiftSheet({
  open,
  onClose,
  eventSlug,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  eventSlug: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [note, setNote] = useState("");
  const [isQuota, setIsQuota] = useState(false);
  const [quotaTarget, setQuotaTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setCategory("");
    setPrice("");
    setStore("");
    setNote("");
    setIsQuota(false);
    setQuotaTarget("");
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/eventos/${eventSlug}/presentes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        price: Number(price),
        store: store.trim() || undefined,
        note: note.trim() || undefined,
        quotaTarget: isQuota ? Number(quotaTarget) : undefined,
      }),
    });
    const body = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(body?.error ?? "Não foi possível cadastrar o presente.");
      return;
    }

    onSaved();
    close();
  }

  const disabled =
    saving ||
    !name.trim() ||
    !category.trim() ||
    !(Number(price) > 0) ||
    (isQuota && !(Number(quotaTarget) > 0));

  return (
    <Sheet open={open} onClose={close} maxWidth={440}>
      <div>
        <div className="mb-5 font-display text-[22px] font-semibold">
          Adicionar presente
        </div>
        <div className="flex flex-col gap-3.5">
          <Field label="Nome">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jogo de panelas"
            />
          </Field>
          <Field label="Categoria">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Cozinha"
            />
          </Field>
          <Field label="Preço (R$)">
            <Input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="450"
            />
          </Field>
          <Field label="Loja (opcional)">
            <Input
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="Nome ou link"
            />
          </Field>
          <Field label="Observação (opcional)">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Cor, modelo…"
            />
          </Field>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-line bg-paper-2 p-3.5">
            <div>
              <div className="text-[14px] font-semibold">Presente de cota</div>
              <p className="mt-0.5 text-[12.5px] text-ink-soft">
                Vários convidados contribuem até atingir uma meta.
              </p>
            </div>
            <Toggle
              label="Presente de cota"
              checked={isQuota}
              onChange={setIsQuota}
            />
          </div>
          {isQuota && (
            <Field label="Meta da cota (R$)">
              <Input
                inputMode="numeric"
                value={quotaTarget}
                onChange={(e) =>
                  setQuotaTarget(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="2000"
              />
            </Field>
          )}
        </div>

        {error && <p className="mt-3 text-[13.5px] text-danger">{error}</p>}

        <div className="mt-6 flex gap-2.5">
          <Button variant="outline" full onClick={close}>
            Cancelar
          </Button>
          <Button full disabled={disabled} onClick={submit}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Editar                                                              */
/* ------------------------------------------------------------------ */

function EditGiftSheet({
  gift,
  onClose,
  eventSlug,
  onSaved,
}: {
  gift: Gift;
  onClose: () => void;
  eventSlug: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(gift.name);
  const [category, setCategory] = useState(gift.category);
  const [price, setPrice] = useState(String(gift.price));
  const [store, setStore] = useState(gift.store ?? "");
  const [note, setNote] = useState(gift.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/eventos/${eventSlug}/presentes/${gift.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        price: Number(price),
        store: store.trim(),
        note: note.trim(),
      }),
    });
    const body = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(body?.error ?? "Não foi possível salvar as alterações.");
      return;
    }

    onSaved();
    onClose();
  }

  const disabled =
    saving || !name.trim() || !category.trim() || !(Number(price) > 0);

  return (
    <Sheet open onClose={onClose} maxWidth={440}>
      <div>
        <div className="mb-5 font-display text-[22px] font-semibold">
          Editar presente
        </div>
        <div className="flex flex-col gap-3.5">
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Categoria">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </Field>
          <Field label="Preço (R$)">
            <Input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </Field>
          <Field label="Loja (opcional)">
            <Input value={store} onChange={(e) => setStore(e.target.value)} />
          </Field>
          <Field label="Observação (opcional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        {gift.quota && (
          <p className="mt-3 text-[12.5px] text-ink-faint">
            A meta da cota não pode ser alterada por aqui.
          </p>
        )}
        {error && <p className="mt-3 text-[13.5px] text-danger">{error}</p>}

        <div className="mt-6 flex gap-2.5">
          <Button variant="outline" full onClick={onClose}>
            Cancelar
          </Button>
          <Button full disabled={disabled} onClick={submit}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
