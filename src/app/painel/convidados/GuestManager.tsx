"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Input, Sheet } from "@/components/ui";
import { GUESTS, GUEST_GROUPS, guestStats } from "@/lib/fixtures/guests";
import { shortDate } from "@/lib/format";
import type { Guest, RsvpStatus } from "@/lib/types";

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

/**
 * O evento vem do banco; a lista de convidados ainda é fixture, até o change
 * `add-guests-rsvp-backend`.
 */
export function GuestManager({ event }: { event: { title: string } }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RsvpStatus | "todos">("todos");
  const [group, setGroup] = useState<string>("todos");
  const [detail, setDetail] = useState<Guest | null>(null);

  const stats = guestStats(GUESTS);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GUESTS.filter((g) => status === "todos" || g.status === status)
      .filter((g) => group === "todos" || g.group === group)
      .filter((g) => q.length === 0 || g.name.toLowerCase().includes(q));
  }, [search, status, group]);

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
          <Button variant="outline">Importar lista</Button>
          <Button>Enviar convites em massa</Button>
        </div>
      </div>

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
          {GUEST_GROUPS.map((g) => (
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
                  <td className="px-6 py-4 text-[15px] font-medium">{g.name}</td>
                  <td className="px-6 py-4 text-[14px] text-ink-soft">{g.group}</td>
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

        {filtered.length === 0 && (
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
            <div className="mb-5 text-[14px] text-ink-soft">{detail.group}</div>

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

            <div className="flex gap-2.5">
              <Button variant="outline" full onClick={() => setDetail(null)}>
                Fechar
              </Button>
              <Button full>Reenviar convite</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
