"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Input, Pill, Select } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import { shortDate } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

const STATUS_LABEL: Record<EventSummary["status"], string> = {
  rascunho: "rascunho",
  publicado: "publicado",
  encerrado: "encerrado",
};

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

type ClienteOption = { id: string; label: string };

/**
 * Busca e listagem de eventos da plataforma inteira. Filtra por texto (título,
 * cidade, local, anfitriões) e por conta de cliente anfitriã; alterna entre
 * lista e calendário mensal — as duas vistas do mesmo filtro.
 */
export function EventosBuscador({
  events,
  clientes,
}: {
  events: EventSummary[];
  clientes: ClienteOption[];
}) {
  const [query, setQuery] = useState("");
  const [hostProfileId, setHostProfileId] = useState("");
  const [view, setView] = useState<"lista" | "calendario">("lista");

  const clienteLabelById = useMemo(
    () => new Map(clientes.map((c) => [c.id, c.label])),
    [clientes],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (hostProfileId && e.hostProfileId !== hostProfileId) return false;
      if (!q) return true;
      const haystack = [e.title, e.city, e.venue, e.hosts, clienteLabelById.get(e.hostProfileId)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [events, query, hostProfileId, clienteLabelById]);

  return (
    <div>
      {/* Filtros --------------------------------------------------------- */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, cidade, local ou anfitrião…"
          className="sm:flex-1"
        />
        <Select
          value={hostProfileId}
          onChange={(e) => setHostProfileId(e.target.value)}
          className="sm:w-[280px]"
        >
          <option value="">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Pill active={view === "lista"} onClick={() => setView("lista")} type="button">
            Lista
          </Pill>
          <Pill active={view === "calendario"} onClick={() => setView("calendario")} type="button">
            Calendário
          </Pill>
        </div>
      </div>

      <p className="mb-4 text-[13px] text-ink-soft">
        {filtered.length} {filtered.length === 1 ? "evento encontrado" : "eventos encontrados"}
      </p>

      {view === "lista" ? (
        <ListaEventos events={filtered} clienteLabelById={clienteLabelById} />
      ) : (
        <CalendarioEventos events={filtered} clienteLabelById={clienteLabelById} />
      )}
    </div>
  );
}

function ListaEventos({
  events,
  clienteLabelById,
}: {
  events: EventSummary[];
  clienteLabelById: Map<string, string>;
}) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="overflow-hidden rounded-2xl bg-paper shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table style={{ minWidth: 760 }} className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {["Evento", "Cliente anfitrião", "Data", "Cidade", "Estado", "Página"].map((h) => (
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
            {sorted.map((e) => (
              <tr key={e.id} className="border-b border-[rgba(42,39,36,0.06)]">
                <td className="px-6 py-4 text-[15px] font-medium">
                  <Link href={eventUrl(e)} className="text-ink no-underline hover:underline">
                    {e.title}
                  </Link>
                </td>
                <td className="px-6 py-4 text-[14.5px] text-ink-2">
                  {clienteLabelById.get(e.hostProfileId) ?? e.hosts ?? "—"}
                </td>
                <td className="px-6 py-4 text-[14.5px] text-ink-2">{shortDate(e.date)}</td>
                <td className="px-6 py-4 text-[14.5px] text-ink-2">{e.city || "—"}</td>
                <td className="px-6 py-4">
                  <Badge tone={e.status === "publicado" ? "accent" : "neutral"}>
                    {STATUS_LABEL[e.status]}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/eventos/${e.slug}/editor`}
                    className="text-[14px] font-semibold text-accent no-underline hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[15px] text-ink-faint">
                  Nenhum evento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarioEventos({
  events,
  clienteLabelById,
}: {
  events: EventSummary[];
  clienteLabelById: Map<string, string>;
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const byDay = useMemo(() => {
    const map = new Map<string, EventSummary[]>();
    for (const e of events) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: { date: Date | null }[] = [];
  for (let i = 0; i < startOffset; i += 1) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d += 1) cells.push({ date: new Date(year, month, d) });
  while (cells.length % 7 !== 0) cells.push({ date: null });

  const monthLabel = firstOfMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl bg-paper p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-[19px] font-semibold capitalize">{monthLabel}</h2>
        <div className="flex gap-2">
          <Pill type="button" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            ← Anterior
          </Pill>
          <Pill type="button" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Hoje
          </Pill>
          <Pill type="button" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            Próximo →
          </Pill>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-[rgba(42,39,36,0.08)]">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="bg-paper-2 px-2 py-2 text-center text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint"
          >
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} className="min-h-[104px] bg-paper" />;
          const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
          const dayEvents = byDay.get(key) ?? [];
          const isToday = key === `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

          return (
            <div key={i} className="min-h-[104px] bg-paper p-2">
              <div
                className={`mb-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] font-semibold ${
                  isToday ? "bg-accent text-on-accent" : "text-ink-soft"
                }`}
              >
                {cell.date.getDate()}
              </div>
              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <Link
                    key={e.id}
                    href={eventUrl(e)}
                    title={`${e.title} · ${clienteLabelById.get(e.hostProfileId) ?? e.hosts ?? ""}`}
                    className={`truncate rounded-md px-1.5 py-1 text-[11.5px] font-semibold no-underline ${
                      e.status === "publicado"
                        ? "bg-accent text-on-accent"
                        : "bg-paper-2 text-ink-2"
                    }`}
                  >
                    {e.title}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[11px] text-ink-faint">+{dayEvents.length - 3} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
