"use client";

import { useState } from "react";
import { GuestShell } from "@/components/GuestShell";
import { ImageSlot } from "@/components/ImageSlot";
import { Button, Input, ProgressBar } from "@/components/ui";
import { GIFTS } from "@/lib/fixtures/gifts";
import { brl } from "@/lib/format";
import type { EventSummary, Gift } from "@/lib/types";

type View = "list" | "checkout" | "success";
type Payment = "pix" | "cartao";

const PRESETS = [50, 100, 250, 500];

export function GiftList({ event }: { event: EventSummary }) {
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<Gift | null>(null);
  const [payment, setPayment] = useState<Payment>("pix");
  const [preset, setPreset] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [copied, setCopied] = useState(false);

  const openCheckout = (g: Gift) => {
    setSelected(g);
    setPreset(null);
    setCustom("");
    setView("checkout");
  };

  const backToList = () => {
    setView("list");
    setSelected(null);
  };

  const isQuota = !!selected?.quota;
  const amount = preset ?? Number(custom) ?? 0;
  const confirmDisabled = isQuota && !(amount > 0);

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

          <div className="grid grid-cols-2 gap-3.5">
            {GIFTS.map((g) => {
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
                    {taken && (
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
            ✓
          </div>
          <h1 className="mb-3 font-display text-[26px] font-semibold leading-[1.25]">
            Presente enviado com carinho!
          </h1>
          <p className="mb-8 max-w-[290px] text-[16px] leading-[1.7] text-ink-soft">
            Obrigado por fazer parte desse momento. {event.hosts} vão adorar saber disso.
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

        <span className="mb-2.5 block text-[13px] tracking-wide text-ink-soft">
          Forma de pagamento
        </span>
        <div className="mb-6 flex gap-2.5">
          {(["pix", "cartao"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setPayment(m)}
              className={`flex-1 cursor-pointer rounded-[10px] border px-3 py-3.5 text-[15px] font-semibold ${
                payment === m
                  ? "border-accent bg-accent text-on-accent"
                  : "border-[rgba(42,39,36,0.2)] bg-white text-ink"
              }`}
            >
              {m === "pix" ? "Pix" : "Cartão"}
            </button>
          ))}
        </div>

        {payment === "pix" ? (
          <div className="mb-5 text-center">
            <div className="mx-auto mb-4 h-[180px] w-[180px] overflow-hidden rounded-xl">
              <ImageSlot placeholder="QR Code Pix" />
            </div>
            <p className="mb-2.5 text-[13.5px] text-ink-soft">
              Escaneie com o app do seu banco ou copie o código abaixo
            </p>
            <div className="flex gap-2">
              <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-[10px] bg-paper-2 px-3.5 py-3 text-left text-[12.5px] text-ink-soft">
                00020126580014BR.GOV.BCB.PIX...A93F
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                }}
              >
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex flex-col gap-3.5">
            <Input
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
              placeholder="Número do cartão"
              inputMode="numeric"
            />
            <Input
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
              placeholder="Nome impresso no cartão"
            />
            <div className="flex gap-3">
              <Input
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                placeholder="Validade (MM/AA)"
                className="flex-1"
              />
              <Input
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                placeholder="CVV"
                className="w-24"
              />
            </div>
          </div>
        )}

        <div className="flex-1" />
        <div className="py-6">
          <Button full size="lg" disabled={confirmDisabled} onClick={() => setView("success")}>
            {isQuota && amount > 0 ? `Confirmar presente de ${brl(amount)}` : "Confirmar presente"}
          </Button>
          <p className="mt-3 text-center text-[12px] text-ink-faint">
            Pagamento simulado — nenhuma cobrança é feita nesta versão.
          </p>
        </div>
      </div>
    </GuestShell>
  );
}
