"use client";

import { useEffect, useState } from "react";
import { GuestShell } from "@/components/GuestShell";
import { ImageSlot } from "@/components/ImageSlot";
import { Button, Input, ProgressBar } from "@/components/ui";
import { brl } from "@/lib/format";
import type { EventSummary, Gift } from "@/lib/types";

type View = "list" | "checkout" | "success";

const PRESETS = [50, 100, 250, 500];

/** Estado de um checkout em andamento — `"processando"` até o webhook confirmar. */
type PaymentPhase = "processando" | "confirmado" | "falho";

export function GiftList({ event }: { event: EventSummary }) {
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<Gift | null>(null);
  const [preset, setPreset] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>("processando");

  const load = () => {
    fetch(`/api/eventos/${event.slug}/presentes`)
      .then((res) => res.json())
      .then((body) => setGifts(body.data ?? []));
  };

  useEffect(load, [event.slug]);

  const openCheckout = (g: Gift) => {
    setSelected(g);
    setPreset(null);
    setCustom("");
    setBuyerName("");
    setBuyerEmail("");
    setError(null);
    setView("checkout");
  };

  const backToList = () => {
    setView("list");
    setSelected(null);
    load();
  };

  const isQuota = !!selected?.quota;
  const amount = preset ?? (Number(custom) || 0);
  const confirmDisabled = submitting || !buyerName.trim() || (isQuota && !(amount > 0));

  async function confirmar() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/eventos/${event.slug}/presentes/${selected.id}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerName,
        buyerEmail: buyerEmail || undefined,
        amount: isQuota ? amount : undefined,
      }),
    });
    const body = await res.json().catch(() => null);
    setSubmitting(false);

    if (!res.ok) {
      setError(body?.error ?? "Não foi possível continuar com este presente.");
      return;
    }

    setPaymentPhase("processando");
    setView("success");
    pollStatus(body.data.paymentId);
  }

  /**
   * O retorno a esta tela não prova pagamento nenhum — só o webhook assinado
   * confirma ("Requirement: Confirmação exclusivamente por webhook assinado").
   * Sem provedor real conectado, a única forma de saber é perguntar ao
   * status do pagamento; aqui isso só reflete o que já está no banco.
   */
  function pollStatus(paymentId: string) {
    fetch(`/api/pagamentos/status/${paymentId}`)
      .then((res) => res.json())
      .then((body) => {
        if (body?.data?.status === "pago") setPaymentPhase("confirmado");
        else if (body?.data?.status === "falho") setPaymentPhase("falho");
      })
      .catch(() => {});
  }

  /* ---------------------------------------------------------------- */
  /* Lista                                                             */
  /* ---------------------------------------------------------------- */
  if (view === "list") {
    return (
      <GuestShell event={event}>
        <div className="px-6 pb-8">
          <h1 className="mb-2 font-display text-[30px] font-semibold">Lista de Presentes</h1>
          <p className="mb-6 text-[15px] leading-relaxed text-ink-soft">
            Sua presença já é o maior presente. Mas se quiser nos ajudar a começar essa nova fase,
            escolhemos alguns itens com carinho.
          </p>

          {gifts === null ? (
            <p className="text-sm text-ink-faint">Carregando lista de presentes…</p>
          ) : gifts.length === 0 ? (
            <p className="text-sm text-ink-faint">Nenhum presente cadastrado ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {gifts.map((g) => {
                const taken = g.status !== "disponivel";
                const pct = g.quota
                  ? Math.min(100, Math.round((g.quota.raised / g.quota.target) * 100))
                  : 0;
                return (
                  <div
                    key={g.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white"
                  >
                    <div className="relative aspect-[4/3] w-full">
                      <ImageSlot placeholder={g.name} compact />
                      {taken && !g.quota && (
                        <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-[rgba(42,39,36,0.55)] px-2.5 py-1 text-[11px] tracking-wide text-paper">
                          {g.status === "comprado" ? "Já presenteado" : "Reservado"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <div className="mb-1 text-sm font-semibold leading-tight">{g.name}</div>
                      {g.quota ? (
                        <div className="my-1.5">
                          <ProgressBar value={pct} />
                          <div className="mt-1.5 text-[11.5px] text-ink-soft">
                            {brl(g.quota.raised)} de {brl(g.quota.target)}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-2.5 text-sm text-ink-soft">{brl(g.price)}</div>
                      )}
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        full
                        disabled={taken}
                        variant={taken ? "ghost" : "primary"}
                        onClick={() => openCheckout(g)}
                      >
                        {taken ? "Já escolhido" : g.quota ? "Contribuir" : "Presentear"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GuestShell>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Sucesso                                                           */
  /* ---------------------------------------------------------------- */
  if (view === "success") {
    return (
      <GuestShell event={event}>
        <div className="flex flex-1 animate-[fade-up_0.4s_ease_both] flex-col items-center justify-center px-7 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-[28px] text-on-accent">
            {paymentPhase === "processando" ? "…" : "✓"}
          </div>
          <h1 className="mb-3 font-display text-[26px] font-semibold leading-[1.25]">
            {paymentPhase === "processando"
              ? "Confirmação em processamento"
              : "Presente enviado com carinho!"}
          </h1>
          <p className="mb-8 max-w-[290px] text-[16px] leading-[1.7] text-ink-soft">
            {paymentPhase === "processando"
              ? "Estamos aguardando a confirmação do pagamento. Isso pode levar alguns instantes."
              : `Obrigado por fazer parte desse momento. ${event.hosts} vão adorar saber disso.`}
          </p>
          <Button variant="outline" size="lg" onClick={backToList}>
            Voltar para a lista
          </Button>
        </div>
      </GuestShell>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Checkout                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <GuestShell event={event}>
      <div className="flex flex-1 animate-[fade-up_0.35s_ease_both] flex-col px-6">
        <div className="flex items-center gap-3 pb-5">
          <button
            onClick={backToList}
            aria-label="Voltar"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg"
          >
            ←
          </button>
          <div className="text-[16px] font-semibold">Presentear</div>
        </div>

        <div className="mb-6 flex items-center gap-3.5 rounded-2xl bg-paper-2 p-3.5">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px]">
            <ImageSlot placeholder="Item" compact />
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-tight">{selected?.name}</div>
            <div className="mt-0.5 text-[13.5px] text-ink-soft">
              {selected?.quota
                ? `${brl(selected.quota.raised)} arrecadados de ${brl(selected.quota.target)}`
                : selected
                  ? brl(selected.price)
                  : ""}
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3.5">
          <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Seu nome" />
          <Input
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            placeholder="Seu e-mail (opcional)"
          />
        </div>

        {isQuota && (
          <div className="mb-6">
            <span className="mb-2.5 block text-[13px] tracking-wide text-ink-soft">
              Quanto você gostaria de contribuir?
            </span>
            <div className="mb-3 flex flex-wrap gap-2">
              {PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setPreset(v);
                    setCustom("");
                  }}
                  className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold ${
                    preset === v
                      ? "border-accent bg-accent text-on-accent"
                      : "border-[rgba(42,39,36,0.2)] bg-white text-ink"
                  }`}
                >
                  {brl(v)}
                </button>
              ))}
            </div>
            <Input
              inputMode="numeric"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value.replace(/[^0-9]/g, ""));
                setPreset(null);
              }}
              placeholder="Outro valor (R$)"
            />
          </div>
        )}

        {error && <p className="mb-4 text-[13.5px] text-danger">{error}</p>}

        <div className="flex-1" />
        <div className="py-6">
          <Button full size="lg" disabled={confirmDisabled} onClick={confirmar}>
            {submitting
              ? "Enviando…"
              : isQuota && amount > 0
                ? `Confirmar presente de ${brl(amount)}`
                : "Confirmar presente"}
          </Button>
          <p className="mt-3 text-center text-[12px] text-ink-faint">
            Você será direcionado para o pagamento (Pix ou cartão) na etapa seguinte.
          </p>
        </div>
      </div>
    </GuestShell>
  );
}
