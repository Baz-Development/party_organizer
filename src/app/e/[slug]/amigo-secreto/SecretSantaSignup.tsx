"use client";

import { useState } from "react";
import { GuestShell } from "@/components/GuestShell";
import { Button, Input, LinkButton } from "@/components/ui";
import { SECRET_SANTA_CONFIG } from "@/lib/fixtures/secret-santa";
import { longDate } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

const MAX_ITEMS = 5;

export function SecretSantaSignup({ event }: { event: EventSummary }) {
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([
    "Vela aromática",
    "Livro de receitas",
  ]);

  const addDisabled = draft.trim().length === 0 || wishlist.length >= MAX_ITEMS;
  const saveDisabled = wishlist.length === 0;

  const add = () => {
    if (addDisabled) return;
    setWishlist((w) => [...w, draft.trim()]);
    setDraft("");
  };

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
            <LinkButton href={`/e/${event.slug}/amigo-secreto/revelacao`}>
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

        <div className="mb-6 flex items-center gap-3 rounded-xl bg-paper-2 px-4 py-3.5">
          <div className="text-[13px] text-ink-soft">Participando como</div>
          <div className="text-sm font-semibold">Você</div>
        </div>

        <div className="mb-7 rounded-2xl bg-ink px-4.5 py-4">
          <div className="mb-1.5 text-xs uppercase tracking-wider text-accent-soft">
            Sugestão dos anfitriões
          </div>
          <div className="text-[15px] text-paper">
            Valor sugerido: {SECRET_SANTA_CONFIG.budget}
          </div>
          <div className="mt-1 text-[13px] text-paper/60">
            Sorteio em {longDate(SECRET_SANTA_CONFIG.drawDate)}
          </div>
        </div>

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

        <div className="flex-1" />
        <div className="pt-6">
          <Button full size="lg" disabled={saveDisabled} onClick={() => setSaved(true)}>
            Salvar minha lista
          </Button>
        </div>
      </div>
    </GuestShell>
  );
}
