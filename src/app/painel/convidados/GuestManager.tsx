"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Input, Sheet } from "@/components/ui";
import { shortDate } from "@/lib/format";
import type { Guest, RsvpStatus } from "@/lib/types";

const EMAIL_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  enviando: "Enviando",
  entregue: "Entregue",
  falha: "Falhou",
};

const EMAIL_STATUS_TONE: Record<string, "ok" | "neutral" | "danger"> = {
  pendente: "neutral",
  enviando: "neutral",
  entregue: "ok",
  falha: "danger",
};

const EMAIL_TEMPLATE_LABEL: Record<string, string> = {
  convite: "Convite",
  lembrete_rsvp: "Lembrete de RSVP",
  confirmacao_rsvp: "Confirmação de RSVP",
  recibo_presente: "Recibo de presente",
  revelacao_amigo_secreto: "Revelação do amigo secreto",
  acesso_painel: "Acesso ao painel",
};

interface EmailHistoryEntry {
  id: string;
  recipientEmail: string;
  template: string;
  status: string;
  lastError: string | null;
  createdAt: string;
}

const FILTERS: { key: RsvpStatus | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "confirmado", label: "Confirmados" },
  { key: "pendente", label: "Pendentes" },
  { key: "recusado", label: "Recusaram" },
];

const STATUS_LABEL: Record<RsvpStatus, string> = {
  confirmado: "Confirmado",
  pendente: "Pendente",
  recusado: "Recusou",
};

const STATUS_TONE: Record<RsvpStatus, "ok" | "neutral" | "danger"> = {
  confirmado: "ok",
  pendente: "neutral",
  recusado: "danger",
};

interface Stats {
  convidados: number;
  confirmados: number;
  recusados: number;
  pendentes: number;
  totalPessoas: number;
  criancas: number;
  restricoes: number;
  taxaResposta: number;
}

const EMPTY_STATS: Stats = {
  convidados: 0,
  confirmados: 0,
  recusados: 0,
  pendentes: 0,
  totalPessoas: 0,
  criancas: 0,
  restricoes: 0,
  taxaResposta: 0,
};

export function GuestManager({ event }: { event: { slug: string; title: string } }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RsvpStatus | "todos">("todos");
  const [group, setGroup] = useState<string>("todos");
  const [detail, setDetail] = useState<Guest | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<EmailHistoryEntry[]>([]);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/eventos/${event.slug}/convidados`);
    const body = await res.json();
    setGuests(body.data ?? []);
    setStats(body.stats ?? EMPTY_STATS);
    setLoading(false);
  }, [event.slug]);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/eventos/${event.slug}/convidados`)
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        setGuests(body.data ?? []);
        setStats(body.stats ?? EMPTY_STATS);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [event.slug]);

  const groups = useMemo(
    () => Array.from(new Set(guests.map((g) => g.group).filter(Boolean))),
    [guests],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests
      .filter((g) => status === "todos" || g.status === status)
      .filter((g) => group === "todos" || g.group === group)
      .filter((g) => q.length === 0 || g.name.toLowerCase().includes(q));
  }, [guests, search, status, group]);

  async function handleDelete(guest: Guest) {
    await fetch(`/api/eventos/${event.slug}/convidados/${guest.id}`, { method: "DELETE" });
    setDetail(null);
    await load();
  }

  async function handleSendInvites(guestIds?: string[]) {
    setSendingInvites(true);
    setInviteResult(null);
    const res = await fetch(`/api/eventos/${event.slug}/convidados/enviar-convites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guestIds ? { guestIds } : {}),
    });
    const body = await res.json().catch(() => null);
    setSendingInvites(false);

    if (!res.ok) {
      setInviteResult(body?.error ?? "Não foi possível enviar os convites.");
      return;
    }

    const { enfileirados, naoEnviaveis } = body.data as {
      enfileirados: number;
      naoEnviaveis: { guestId: string; name: string }[];
    };
    setInviteResult(
      naoEnviaveis.length > 0
        ? `${enfileirados} convite(s) enfileirado(s). ${naoEnviaveis.length} sem e-mail cadastrado.`
        : `${enfileirados} convite(s) enfileirado(s).`,
    );
  }

  async function openHistory() {
    setHistoryOpen(true);
    const res = await fetch(`/api/eventos/${event.slug}/convidados/historico-emails`);
    const body = await res.json().catch(() => null);
    setHistory(body?.data ?? []);
  }

  async function handleExport() {
    const res = await fetch(`/api/eventos/${event.slug}/convidados/exportar`);
    const body = await res.json();
    const blob = new Blob([JSON.stringify(body.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `convidados-${event.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 pb-16">
      {/* Cabeçalho ---------------------------------------------------- */}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">
            {event.title}
          </div>
          <h1 className="font-display text-[30px] font-semibold">Convidados</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" onClick={openHistory}>
            Histórico de e-mails
          </Button>
          <Button variant="outline" disabled={sendingInvites} onClick={() => handleSendInvites()}>
            {sendingInvites ? "Enviando..." : "Enviar convites pendentes"}
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Importar lista
          </Button>
          <Button variant="outline" onClick={handleExport}>
            Exportar
          </Button>
          <Button onClick={() => setAddOpen(true)}>Adicionar convidado</Button>
        </div>
      </div>

      {inviteResult && <p className="mb-4 text-[13.5px] text-ink-soft">{inviteResult}</p>}

      {/* Resumo -------------------------------------------------------- */}
      <div className="my-8 flex flex-wrap gap-7">
        {[
          { v: stats.convidados, l: "convidados", c: "" },
          { v: stats.confirmados, l: "confirmados", c: "text-accent" },
          { v: stats.pendentes, l: "pendentes", c: "text-ink-faint" },
          { v: stats.recusados, l: "recusaram", c: "text-danger" },
          { v: stats.totalPessoas, l: "pessoas no total", c: "" },
          { v: stats.restricoes, l: "com restrição", c: "" },
        ].map((s) => (
          <div key={s.l}>
            <div className={`font-display text-[26px] font-semibold ${s.c}`}>{s.v}</div>
            <div className="text-[13px] text-ink-soft">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filtros ------------------------------------------------------- */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome..."
          className="min-w-[220px] flex-1 bg-paper px-4 py-3 text-[14.5px]"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={`cursor-pointer rounded-full border px-4 py-2.5 text-[13.5px] font-semibold ${
                status === f.key
                  ? "border-ink bg-ink text-paper"
                  : "border-[rgba(42,39,36,0.15)] bg-paper text-ink-soft hover:bg-paper-2"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="cursor-pointer rounded-full border border-[rgba(42,39,36,0.15)] bg-paper px-4 py-2.5 text-[13.5px] font-semibold text-ink-soft"
        >
          <option value="todos">Todos os grupos</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela -------------------------------------------------------- */}
      <div className="overflow-hidden rounded-2xl bg-paper shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {["Nome", "Grupo", "Status", "Acomp.", "Restrição alimentar", "Respondeu em"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-ink-faint"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr
                  key={g.id}
                  onClick={() => setDetail(g)}
                  className="cursor-pointer border-b border-[rgba(42,39,36,0.06)] transition hover:bg-paper-2"
                >
                  <td className="px-6 py-4 text-[15px] font-medium">
                    {g.name}
                    {g.unlisted && (
                      <span className="ml-2 text-[11px] font-normal text-ink-faint">
                        (não listado)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-ink-soft">{g.group || "—"}</td>
                  <td className="px-6 py-4">
                    <Badge tone={STATUS_TONE[g.status]}>{STATUS_LABEL[g.status]}</Badge>
                  </td>
                  <td className="px-6 py-4 text-[14.5px] text-ink-2">
                    {g.companions + g.kids > 0
                      ? `${g.companions}${g.kids ? ` +${g.kids} 🧒` : ""}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-[14.5px] text-ink-soft">{g.dietary ?? "—"}</td>
                  <td className="px-6 py-4 text-[14px] text-ink-faint">
                    {g.respondedAt ? shortDate(g.respondedAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-[15px] text-ink-faint">
            Nenhum convidado encontrado com esse filtro.
          </div>
        )}
      </div>

      {/* Detalhe ------------------------------------------------------- */}
      <Sheet open={!!detail} onClose={() => setDetail(null)} maxWidth={420}>
        {detail && (
          <div>
            <div className="mb-1 font-display text-[24px] font-semibold">{detail.name}</div>
            <div className="mb-5 text-[14px] text-ink-soft">{detail.group || "Sem grupo"}</div>

            <dl className="mb-6 flex flex-col gap-3">
              {[
                ["Status", STATUS_LABEL[detail.status]],
                ["E-mail", detail.email ?? "—"],
                ["Telefone", detail.phone ?? "—"],
                ["Acompanhantes", String(detail.companions)],
                ["Crianças", String(detail.kids)],
                ["Restrição alimentar", detail.dietary ?? "—"],
                ["Convidado em", shortDate(detail.invitedAt)],
                ["Respondeu em", detail.respondedAt ? shortDate(detail.respondedAt) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt className="text-[13.5px] text-ink-soft">{k}</dt>
                  <dd className="text-right text-[14.5px] font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-col gap-2.5">
              <Button
                full
                variant="outline"
                disabled={!detail.email || sendingInvites}
                onClick={() => handleSendInvites([detail.id])}
              >
                {detail.email ? "Reenviar convite" : "Sem e-mail cadastrado"}
              </Button>
              <div className="flex gap-2.5">
                <Button variant="outline" full onClick={() => setDetail(null)}>
                  Fechar
                </Button>
                <Button full onClick={() => handleDelete(detail)}>
                  Remover
                </Button>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* Histórico de e-mails ------------------------------------------ */}
      <Sheet open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth={480}>
        <div>
          <div className="mb-5 font-display text-[22px] font-semibold">Histórico de e-mails</div>
          {history.length === 0 && (
            <p className="text-[13.5px] text-ink-faint">Nenhuma mensagem enviada ainda.</p>
          )}
          <div className="flex flex-col gap-3">
            {history.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-line px-4 py-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium">{entry.recipientEmail}</span>
                  <Badge tone={EMAIL_STATUS_TONE[entry.status] ?? "neutral"}>
                    {EMAIL_STATUS_LABEL[entry.status] ?? entry.status}
                  </Badge>
                </div>
                <div className="text-[13px] text-ink-soft">
                  {EMAIL_TEMPLATE_LABEL[entry.template] ?? entry.template} · {shortDate(entry.createdAt)}
                </div>
                {entry.status === "falha" && entry.lastError && (
                  <div className="mt-1 text-[12.5px] text-danger">{entry.lastError}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Sheet>

      {/* Adicionar convidado --------------------------------------- */}
      <AddGuestSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        eventSlug={event.slug}
        onCreated={load}
      />

      {/* Importação em lote ------------------------------------------ */}
      <ImportGuestsSheet
        open={importOpen}
        onClose={() => setImportOpen(false)}
        eventSlug={event.slug}
        onImported={load}
      />
    </div>
  );
}

function AddGuestSheet({
  open,
  onClose,
  eventSlug,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  eventSlug: string;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/eventos/${eventSlug}/convidados`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, group, email, phone }),
    });
    const body = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(body?.error ?? "Não foi possível cadastrar o convidado.");
      return;
    }

    setName("");
    setGroup("");
    setEmail("");
    setPhone("");
    onCreated();
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} maxWidth={420}>
      <div>
        <div className="mb-5 font-display text-[22px] font-semibold">Adicionar convidado</div>
        <div className="flex flex-col gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Grupo" />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" />
        </div>
        {error && <p className="mt-3 text-[13.5px] text-danger">{error}</p>}
        <div className="mt-6 flex gap-2.5">
          <Button variant="outline" full onClick={onClose}>
            Cancelar
          </Button>
          <Button full disabled={!name.trim() || saving} onClick={submit}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function ImportGuestsSheet({
  open,
  onClose,
  eventSlug,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  eventSlug: string;
  onImported: () => void;
}) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ accepted: number; rejected: number } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setResult(null);

    const rows = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, email, group] = line.split(",").map((v) => v?.trim());
        return { name, email, group };
      });

    const res = await fetch(`/api/eventos/${eventSlug}/convidados/importar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const body = await res.json().catch(() => null);
    setSaving(false);

    if (res.ok) {
      setResult({ accepted: body.data?.length ?? 0, rejected: body.rejected?.length ?? 0 });
      onImported();
    }
  }

  return (
    <Sheet open={open} onClose={onClose} maxWidth={480}>
      <div>
        <div className="mb-2 font-display text-[22px] font-semibold">Importar convidados</div>
        <p className="mb-4 text-[13.5px] text-ink-soft">
          Uma linha por convidado: <code>nome, e-mail, grupo</code>. E-mail e grupo são opcionais.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-line-strong bg-white p-3 text-[14px]"
          placeholder={"Ana Souza, ana@email.com, Família da noiva\nCarlos Lima"}
        />
        {result && (
          <p className="mt-3 text-[13.5px] text-ink-soft">
            {result.accepted} convidado(s) importado(s), {result.rejected} rejeitado(s).
          </p>
        )}
        <div className="mt-6 flex gap-2.5">
          <Button variant="outline" full onClick={onClose}>
            Fechar
          </Button>
          <Button full disabled={!text.trim() || saving} onClick={submit}>
            {saving ? "Importando..." : "Importar"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
