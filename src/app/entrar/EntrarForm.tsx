"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { enviarLinkMagico, type EntrarState } from "./actions";

const INITIAL: EntrarState = { status: "idle" };

export function EntrarForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(enviarLinkMagico, INITIAL);

  if (state.status === "enviado") {
    return (
      <div className="animate-[fade-up_0.35s_ease_both] text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-[24px] text-on-accent">
          ✓
        </div>
        <h2 className="mb-2.5 font-display text-[24px] font-semibold">
          Link enviado
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Se houver uma conta para <strong>{state.email}</strong>, o link de
          acesso chega em instantes. Ele vale por uma única entrada.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="next" value={next} />

      <Field label="Seu e-mail" hint="Sem senha: enviamos um link de acesso.">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@email.com"
          aria-invalid={state.status === "erro"}
        />
      </Field>

      {state.status === "erro" && (
        <p role="alert" className="mt-3 text-[13.5px] text-danger">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" full className="mt-6" disabled={pending}>
        {pending ? "Enviando…" : "Receber link de acesso"}
      </Button>
    </form>
  );
}
