"use client";

import { useEffect, useState } from "react";
import { GuestShell } from "@/components/GuestShell";
import { ImageSlot } from "@/components/ImageSlot";
import { Button, LinkButton } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import type { EventSummary, MenuPoll } from "@/lib/types";

type Selection = Record<string, string[]>;

export function MenuVote({
  event,
  polls,
  token,
}: {
  event: EventSummary;
  polls: MenuPoll[];
  token: string | null;
}) {
  const [sent, setSent] = useState(false);
  const [selection, setSelection] = useState<Selection>({});
  const [loadingVotes, setLoadingVotes] = useState(!!token);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetch(`/api/cardapio/${token}`)
      .then((res) => res.json())
      .then((body: { data: Record<string, string[]> }) => {
        if (!cancelled && body.data) setSelection(body.data);
      })
      .finally(() => {
        if (!cancelled) setLoadingVotes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const toggle = (pollId: string, optionId: string, max: number) => {
    setSelection((s) => {
      const current = s[pollId] ?? [];
      if (current.includes(optionId)) {
        return { ...s, [pollId]: current.filter((x) => x !== optionId) };
      }
      if (current.length >= max) return s;
      return { ...s, [pollId]: [...current, optionId] };
    });
  };

  const allAnswered = polls.every((p) => (selection[p.id] ?? []).length > 0);

  const chosen = polls.flatMap((p) =>
    p.options
      .filter((o) => (selection[p.id] ?? []).includes(o.id))
      .map((o) => `${p.course}: ${o.name}`),
  );

  async function handleSubmit() {
    if (!token) {
      setError("Este link não permite votar. Use o link que você recebeu no convite.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      for (const poll of polls) {
        const optionIds = selection[poll.id] ?? [];
        if (optionIds.length === 0) continue;

        const res = await fetch(`/api/cardapio/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pollId: poll.id, optionIds }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error ?? "Não foi possível registrar seu voto.");
          return;
        }
      }

      setSent(true);
    } catch {
      setError("Não foi possível registrar seu voto. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (polls.length === 0) {
    return (
      <GuestShell event={event}>
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <h1 className="mb-2.5 font-display text-[26px] font-semibold leading-[1.25]">
            Nenhuma enquete por aqui ainda
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            O anfitrião ainda não abriu a votação de cardápio.
          </p>
        </div>
      </GuestShell>
    );
  }

  if (sent) {
    return (
      <GuestShell event={event}>
        <div className="flex flex-1 animate-[fade-up_0.4s_ease_both] flex-col items-center justify-center px-7 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-[28px] text-on-accent">
            ✓
          </div>
          <h1 className="mb-3 font-display text-[26px] font-semibold leading-[1.25]">
            Voto registrado!
          </h1>
          <p className="mb-6 max-w-[290px] text-[16px] leading-[1.7] text-ink-soft">
            Obrigado por ajudar a escolher o cardápio da festa. Seus favoritos:
          </p>
          <div className="mb-8 flex w-full flex-col gap-2">
            {chosen.map((c) => (
              <div key={c} className="rounded-[10px] bg-paper-2 px-4 py-3 text-left text-[14.5px]">
                {c}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => setSent(false)}>
              Trocar meu voto
            </Button>
            <LinkButton href={eventUrl(event)} variant="ghost">
              Voltar ao convite
            </LinkButton>
          </div>
        </div>
      </GuestShell>
    );
  }

  return (
    <GuestShell event={event}>
      <div className="flex-1 animate-[fade-up_0.35s_ease_both] px-6 pb-6">
        <h1 className="mb-2 font-display text-[28px] font-semibold">
          Escolha os sabores da festa
        </h1>
        <p className="mb-7 text-[15px] leading-relaxed text-ink-soft">
          Sua opinião ajuda a gente a decidir o que vai rolar no grande dia. Toque nos seus
          favoritos!
        </p>

        {!token && (
          <p className="mb-6 rounded-xl bg-[rgba(200,60,60,0.08)] px-4 py-3 text-[14px] text-[#a63c3c]">
            Use o link do seu convite para votar — este acesso é só para visualização.
          </p>
        )}

        {loadingVotes && <p className="text-ink-soft">Carregando...</p>}

        {!loadingVotes &&
          polls.map((poll) => {
            const picked = selection[poll.id] ?? [];
            const complete = picked.length >= poll.maxChoices;
            return (
              <section key={poll.id} className="mb-8">
                <div className="mb-3.5 flex items-center justify-between gap-3">
                  <h2 className="font-display text-[20px] font-semibold">{poll.course}</h2>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${
                      complete
                        ? "bg-accent text-on-accent"
                        : "bg-[rgba(42,39,36,0.08)] text-ink-soft"
                    }`}
                  >
                    {complete
                      ? "Prontinho!"
                      : poll.maxChoices > 1
                        ? `escolha até ${poll.maxChoices}`
                        : `escolha ${poll.maxChoices}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {poll.options.map((o) => {
                    const selected = picked.includes(o.id);
                    const disabled = !token || (!selected && complete);
                    return (
                      <button
                        key={o.id}
                        onClick={() => toggle(poll.id, o.id, poll.maxChoices)}
                        disabled={disabled}
                        className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left transition ${
                          selected ? "border-accent" : "border-line"
                        } ${disabled ? "cursor-default opacity-50" : "cursor-pointer"}`}
                      >
                        <div className="relative aspect-square w-full">
                          <ImageSlot placeholder={o.name} compact />
                          {selected && (
                            <span className="pointer-events-none absolute right-1.5 top-1.5 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="px-2 py-2.5 text-center text-[13.5px] font-semibold leading-tight">
                          {o.name}
                        </div>
                        <div className="px-2 pb-2.5 text-center text-[11px] text-ink-faint">
                          {o.tags.length > 0 ? `${o.tags.join(" · ")} · ` : ""}
                          {o.votes} {o.votes === 1 ? "voto" : "votos"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}

        {error && (
          <p className="mt-2 rounded-xl bg-[rgba(200,60,60,0.08)] px-4 py-3 text-[14px] text-[#a63c3c]">
            {error}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 bg-[linear-gradient(to_top,var(--paper)_60%,transparent)] px-6 pb-7 pt-6">
        <Button
          full
          size="lg"
          disabled={!allAnswered || submitting || !token}
          onClick={handleSubmit}
        >
          {submitting ? "Enviando..." : "Enviar meu voto"}
        </Button>
      </div>
    </GuestShell>
  );
}
