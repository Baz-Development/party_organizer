"use client";

import { useState } from "react";
import { GuestShell } from "@/components/GuestShell";
import { Button, Input } from "@/components/ui";
import type { EventSummary } from "@/lib/types";

/**
 * Confirmação explícita por botão, não descadastro automático ao abrir o
 * link — scanners de segurança de provedor de e-mail costumam pré-carregar
 * links de mensagens, e um `GET` que já descadastra sozinho descadastraria
 * todo mundo sem ninguém ter clicado.
 */
export function DescadastroConfirm({ event, email: initialEmail }: { event: EventSummary; email: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/eventos/${event.slug}/descadastro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(body?.error ?? "Não foi possível processar o descadastro.");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <GuestShell event={event}>
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <h1 className="mb-3 font-display text-[24px] font-semibold">Descadastro concluído</h1>
          <p className="max-w-[280px] text-[15px] text-ink-soft">
            {email} não vai mais receber e-mails de {event.title}.
          </p>
        </div>
      </GuestShell>
    );
  }

  return (
    <GuestShell event={event}>
      <div className="flex flex-1 flex-col px-6 pb-7 pt-4">
        <h1 className="mb-2 font-display text-[24px] font-semibold">Descadastro</h1>
        <p className="mb-5 text-[15px] leading-relaxed text-ink-soft">
          Confirme o e-mail para parar de receber mensagens não essenciais de{" "}
          <strong>{event.title}</strong>. Recibos de pagamento continuam sendo enviados.
        </p>

        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
        {error && <p className="mt-3 text-[13.5px] text-danger">{error}</p>}

        <div className="pt-6">
          <Button full size="lg" disabled={!email.trim() || saving} onClick={submit}>
            {saving ? "Processando..." : "Confirmar descadastro"}
          </Button>
        </div>
      </div>
    </GuestShell>
  );
}
