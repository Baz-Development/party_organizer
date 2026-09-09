"use client";

import { useEffect, useState } from "react";
import { GuestShell } from "@/components/GuestShell";
import { Button, Input, LinkButton } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import { longDate } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

const MAX_ITEMS = 5;

interface Participation {
  displayName: string;
  wishlist: string[];
  joinedAt: string;
}

export function SecretSantaSignup({ event, token }: { event: EventSummary; token: string | null }) {
  const [loading, setLoading] = useState(!!token);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetch(`/api/amigo-secreto/${token}`)
      .then((res) => res.json())
      .then((body: { data: Participation | null }) => {
        if (cancelled) return;
        if (body.data) {
          setParticipation(body.data);
          setName(body.data.displayName);
          setWishlist(body.data.wishlist);
          setSaved(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const addDisabled = draft.trim().length === 0 || wishlist.length >= MAX_ITEMS;
  const identified = !!participation;
  const canSave = (identified || name.trim().length > 0) && wishlist.length > 0 && !submitting;

  const add = () => {
    if (addDisabled) return;
    setWishlist((w) => [...w, draft.trim()]);
    setDraft("");
  };

  async function handleSave() {
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/amigo-secreto/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          identified ? { wishlist } : { displayName: name, wishlist },
        ),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Não foi possível salvar sua lista.");
        return;
      }

      setSaved(true);
    } catch {
      setError("Não foi possível salvar sua lista. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <GuestShell event={event}>
        <div className="flex flex-1 items-center justify-center px-7 text-center text-ink-soft">
          Carregando...
        </div>
      </GuestShell>
    );
  }

  if (!token) {
    return (
      <GuestShell event={event}>
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <h1 className="mb-2.5 font-display text-[26px] font-semibold leading-[1.25]">
            Link inválido
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            Use o link de convite que você recebeu para entrar no amigo secreto.
          </p>
        </div>
      </GuestShell>
    );
  }

  if (saved) {
    return (
      <GuestShell event={event}>
        <div className="flex flex-1 animate-[fade-up_0.4s_ease_both] flex-col items-center justify-center px-7 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-[28px] text-on-accent">
            ✓
          </div>
          <h1 className="mb-3 font-display text-[26px] font-semibold leading-[1.25]">Lista salva!</h1>
          <p className="mb-8 max-w-[290px] text-[16px] leading-[1.7] text-ink-soft">
            No dia do sorteio, você vai descobrir quem tirou e ver a lista de desejos dessa pessoa.
            Guarde segredo!
          </p>
          <div className="flex flex-col gap-3">
            <LinkButton href={eventUrl(event, `/amigo-secreto/revelacao?convite=${token}`)}>
              Ver meu sorteio
            </LinkButton>
            <Button variant="outline" onClick={() => setSaved(false)}>
              Editar minha lista
            </Button>
          </div>
        </div>
      </GuestShell>
    );
  }

  return (
    <GuestShell event={event}>
      <div className="flex flex-1 animate-[fade-up_0.35s_ease_both] flex-col px-6 pb-7">
        <h1 className="mb-2 font-display text-[28px] font-semibold">Amigo Secreto</h1>
        <p className="mb-5 text-[15px] leading-relaxed text-ink-soft">
          Você está dentro! Conte pra gente algumas coisinhas que gostaria de ganhar, pra deixar seu
          amigo secreto na mão certa.
        </p>

        {!identified && (
          <div className="mb-5">
            <span className="mb-2 block text-[13px] tracking-wide text-ink-soft">
              Como quer aparecer no sorteio?
            </span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome ou apelido"
            />
          </div>
        )}

        {identified && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-paper-2 px-4 py-3.5">
            <div className="text-[13px] text-ink-soft">Participando como</div>
            <div className="text-sm font-semibold">{name}</div>
          </div>
        )}

        {(event.secretSanta.budget || event.secretSanta.drawDate || event.secretSanta.rules) && (
          <div className="mb-7 rounded-2xl bg-ink px-4.5 py-4">
            <div className="mb-1.5 text-xs uppercase tracking-wider text-accent-soft">
              Sugestão dos anfitriões
            </div>
            {event.secretSanta.budget && (
              <div className="text-[15px] text-paper">
                Valor sugerido: {event.secretSanta.budget}
              </div>
            )}
            {event.secretSanta.drawDate && (
              <div className="mt-1 text-[13px] text-paper/60">
                Sorteio em {longDate(event.secretSanta.drawDate)}
              </div>
            )}
            {event.secretSanta.exchangeDate && (
              <div className="mt-1 text-[13px] text-paper/60">
                Troca em {longDate(event.secretSanta.exchangeDate)}
              </div>
            )}
            {event.secretSanta.rules && (
              <div className="mt-2 text-[13px] leading-relaxed text-paper/80">
                {event.secretSanta.rules}
              </div>
            )}
          </div>
        )}

        <span className="mb-2.5 block text-[13px] tracking-wide text-ink-soft">
          O que você gostaria de ganhar? ({wishlist.length}/{MAX_ITEMS})
        </span>
        <div className="mb-4 flex gap-2.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Ex: vela aromática"
            className="flex-1"
          />
          <Button disabled={addDisabled} onClick={add} className="whitespace-nowrap">
            Adicionar
          </Button>
        </div>

        <div className="flex flex-col gap-2.5">
          {wishlist.map((item, i) => (
            <div
              key={`${item}-${i}`}
              className="flex items-center justify-between rounded-[10px] border border-[rgba(42,39,36,0.12)] bg-white px-3.5 py-3"
            >
              <span className="text-[15px]">{item}</span>
              <button
                aria-label={`Remover ${item}`}
                onClick={() => setWishlist((w) => w.filter((_, idx) => idx !== i))}
                className="h-7 w-7 cursor-pointer rounded-full text-base text-ink-faint hover:bg-paper-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {wishlist.length === 0 && (
          <p className="mt-2 text-sm text-ink-faint">
            Nenhum item ainda — adicione pelo menos um para seu amigo secreto ter uma pista.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-[rgba(200,60,60,0.08)] px-4 py-3 text-[14px] text-[#a63c3c]">
            {error}
          </p>
        )}

        <div className="flex-1" />
        <div className="pt-6">
          <Button full size="lg" disabled={!canSave} onClick={handleSave}>
            {submitting ? "Salvando..." : "Salvar minha lista"}
          </Button>
        </div>
      </div>
    </GuestShell>
  );
}
