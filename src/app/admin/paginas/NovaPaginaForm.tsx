"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import type { EventKind } from "@/lib/types";
import { EVENT_KINDS } from "@/lib/validation/event";

const KIND_LABEL: Record<EventKind, string> = {
  casamento: "Casamento",
  debutante: "Debutante (15 anos)",
  infantil: "Aniversário infantil",
  corporativo: "Evento corporativo",
  formatura: "Formatura",
};

export function NovaPaginaForm({ clientes }: { clientes: { id: string; label: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    kind: "casamento" as EventKind,
    title: "",
    date: "",
    venue: "",
    city: "",
    hosts: "",
    hostProfileId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.kind,
          title: form.title.trim(),
          date: form.date,
          venue: form.venue.trim() || undefined,
          city: form.city.trim() || undefined,
          hosts: form.hosts.trim() || undefined,
          hostProfileId: form.hostProfileId,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Não foi possível criar a página.");
        return;
      }
      setCreated({ id: body.data.id, slug: body.data.slug });
      router.refresh();
    });
  };

  if (created) {
    return (
      <div className="rounded-2xl bg-paper p-8 text-center shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
        <h2 className="mb-2 font-display text-[22px] font-semibold">Página criada em rascunho</h2>
        <p className="mb-6 text-[14.5px] text-ink-soft">
          O cliente anfitrião já vê o evento no painel dele.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={eventUrl(created)}
            className="rounded-[10px] border border-line-strong px-5 py-3 text-[14.5px] font-semibold text-ink no-underline"
          >
            Ver página pública
          </Link>
          <Button onClick={() => setCreated(null)}>Criar outra</Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-5 rounded-2xl bg-paper p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)] sm:p-8"
    >
      <Field label="Conta de cliente anfitriã">
        <Select
          value={form.hostProfileId}
          onChange={(e) => set("hostProfileId", e.target.value)}
          required
        >
          <option value="" disabled>
            Selecione um cliente
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tipo de evento">
        <Select value={form.kind} onChange={(e) => set("kind", e.target.value as EventKind)}>
          {EVENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Título do evento" hint="Vira o endereço público do convite.">
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </Field>
      <Field label="Data e hora">
        <Input
          type="datetime-local"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
          required
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Local">
          <Input value={form.venue} onChange={(e) => set("venue", e.target.value)} />
        </Field>
        <Field label="Cidade">
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
      </div>
      <Field label="Anfitriões" hint="Quem assina o convite.">
        <Input value={form.hosts} onChange={(e) => set("hosts", e.target.value)} />
      </Field>
      {error && (
        <p role="alert" className="text-[13.5px] text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending || !form.hostProfileId}>
          {pending ? "Criando…" : "Criar página"}
        </Button>
      </div>
    </form>
  );
}
