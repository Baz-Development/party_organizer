"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, Field, Input } from "@/components/ui";
import type { ClientAccount } from "@/lib/db/clients";
import { shortDate } from "@/lib/format";

/**
 * Cadastro e listagem de contas de cliente. O cadastro (`POST
 * /api/admin/clientes`) só cria a conta — nenhum e-mail sai daqui; o convite
 * de acesso é enviado quando a primeira página do cliente é criada. A conta
 * nasce "aguardando primeiro acesso" e passa a "ativa" quando ela entra pela
 * primeira vez.
 *
 * A coluna "Acesso" reenvia manualmente o e-mail de acesso ao painel (`POST
 * /api/admin/clientes/[id]/acesso`), para quando o disparo automático da
 * criação da página falhou ou o cliente perdeu a mensagem. Fica desabilitada
 * enquanto a conta não tem nenhuma página.
 */
export function ClientesManager({ clientes }: { clientes: ClientAccount[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [accessSendingId, setAccessSendingId] = useState<string | null>(null);
  const [accessFeedback, setAccessFeedback] = useState<
    Record<string, { tone: "ok" | "erro"; message: string }>
  >({});

  const sendAccessEmail = (id: string) => {
    setAccessSendingId(id);
    setAccessFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/clientes/${id}/acesso`, { method: "POST" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAccessFeedback((prev) => ({
            ...prev,
            [id]: { tone: "erro", message: body.error ?? "Não foi possível enviar o e-mail." },
          }));
          return;
        }
        setAccessFeedback((prev) => ({
          ...prev,
          [id]: {
            tone: "ok",
            message: body.recipientEmail
              ? `E-mail de acesso enfileirado para ${body.recipientEmail}.`
              : "E-mail de acesso enfileirado.",
          },
        }));
      } finally {
        setAccessSendingId(null);
      }
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Não foi possível cadastrar o cliente.");
        return;
      }
      setOk(`Conta criada para ${email}. O convite vai por e-mail quando você criar a página dele.`);
      setEmail("");
      setDisplayName("");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form
        onSubmit={submit}
        className="h-fit rounded-2xl bg-paper p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)]"
      >
        <h2 className="mb-4 font-display text-[18px] font-semibold">Cadastrar cliente</h2>
        <div className="grid gap-4">
          <Field label="Nome de exibição">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Marina Andrade"
              required
            />
          </Field>
          <Field label="E-mail" hint="Recebe o link de acesso quando a página dele for criada.">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="marina@exemplo.com"
              required
            />
          </Field>
          {error && (
            <p role="alert" className="text-[13.5px] text-danger">
              {error}
            </p>
          )}
          {ok && <p className="text-[13.5px] text-ok">{ok}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Cadastrando…" : "Cadastrar cliente"}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl bg-paper shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table style={{ minWidth: 640 }} className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {["Cliente", "E-mail", "Situação", "Eventos", "Cadastro", "Acesso"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-ink-faint"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-[rgba(42,39,36,0.06)]">
                  <td className="px-6 py-4 text-[15px] font-medium">{c.displayName}</td>
                  <td className="px-6 py-4 text-[14.5px] text-ink-2">{c.email}</td>
                  <td className="px-6 py-4">
                    <Badge tone={c.status === "ativa" ? "accent" : "neutral"}>
                      {c.status === "ativa" ? "ativa" : "aguardando primeiro acesso"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-[14.5px] text-ink-2">{c.eventCount}</td>
                  <td className="px-6 py-4 text-[14.5px] text-ink-soft">
                    {c.createdAt ? shortDate(c.createdAt) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {c.eventCount === 0 ? (
                      <span
                        className="text-[13px] text-ink-faint"
                        title="Cadastre uma página para este cliente primeiro."
                      >
                        sem página
                      </span>
                    ) : (
                      <div className="grid gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => sendAccessEmail(c.id)}
                          disabled={pending && accessSendingId === c.id}
                        >
                          {pending && accessSendingId === c.id
                            ? "Enviando…"
                            : "Enviar e-mail de acesso"}
                        </Button>
                        {accessFeedback[c.id] && (
                          <p
                            className={`text-[13px] ${
                              accessFeedback[c.id].tone === "ok" ? "text-ok" : "text-danger"
                            }`}
                          >
                            {accessFeedback[c.id].message}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[15px] text-ink-faint">
                    Nenhuma conta de cliente cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
