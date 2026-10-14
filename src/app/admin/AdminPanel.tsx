"use client";

import Link from "next/link";
import { PanelNav } from "@/components/PanelNav";
import { SairButton } from "@/components/SairButton";
import { Badge } from "@/components/ui";
import type { PlatformRevenue } from "@/lib/db/platform";
import { ADMIN_NAV } from "./nav";
import { eventUrl } from "@/lib/event-url";
import { shortDate } from "@/lib/format";
import { themeVars } from "@/lib/themes";
import type { EventSummary, Profile } from "@/lib/types";

const ROLE_LABEL: Record<Profile["role"], string> = {
  cliente: "Cliente",
  admin: "Admin",
};

export function AdminPanel({
  events,
  profiles,
  eventsPerMonth,
  guestsThisMonth,
  platformRevenue,
}: {
  events: EventSummary[];
  profiles: Profile[];
  eventsPerMonth: { label: string; value: number }[];
  guestsThisMonth: number;
  platformRevenue: PlatformRevenue;
}) {
  const maxSeries = Math.max(1, ...eventsPerMonth.map((s) => s.value));

  const eventosAtivos = events.filter((e) => e.status === "publicado").length;
  const rascunhos = events.filter((e) => e.status === "rascunho").length;
  const clientes = profiles.filter((p) => p.role === "cliente").length;

  /**
   * Todas as quatro métricas vêm do banco. A quarta não é "MRR" — a
   * plataforma não cobra assinatura do cliente anfitrião, só o convidado
   * paga (por um presente) — é a soma real de `payments` confirmados
   * (`status = 'pago'`) no mês, via `getPlatformRevenue`.
   */
  const metrics = [
    {
      label: "Eventos ativos",
      value: String(eventosAtivos),
      hint: `${events.length} no total · ${rascunhos} em rascunho`,
      real: true,
    },
    {
      label: "Contas de cliente",
      value: String(clientes),
      hint: `${profiles.length} pessoas com conta`,
      real: true,
    },
    {
      label: "Convidados no mês",
      value: guestsThisMonth.toLocaleString("pt-BR"),
      hint: "Cadastrados em todos os eventos",
      real: true,
    },
    {
      label: "Receita no mês",
      value: platformRevenue.receitaMes,
      hint: `${platformRevenue.crescimento} vs. mês passado · ticket médio ${platformRevenue.ticketMedio}`,
      real: true,
    },
  ];

  return (
    <div style={themeVars({ themeKey: "dourado" })} className="min-h-screen bg-paper-3">
      <PanelNav
        brand="Admin"
        items={ADMIN_NAV}
        right={<SairButton />}
      />

      <div className="mx-auto max-w-[1160px] px-6 py-10 pb-16">
        <div className="mb-8">
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">Plataforma</div>
          <h1 className="font-display text-[30px] font-semibold">Visão geral</h1>
        </div>

        {/* Métricas ----------------------------------------------------- */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-[18px] bg-paper px-6 py-6.5 shadow-[0_8px_28px_rgba(0,0,0,0.04)]"
            >
              <div className="mb-3.5 flex items-center gap-2">
                <span className="text-[12.5px] uppercase tracking-wider text-ink-soft">
                  {m.label}
                </span>
                {!m.real && <Badge>estimado</Badge>}
              </div>
              <div className="mb-2 font-display text-[34px] font-semibold leading-none">
                {m.value}
              </div>
              <div className="text-[13px] text-ink-soft">{m.hint}</div>
            </div>
          ))}
        </div>

        {/* Novos eventos por mês ---------------------------------------- */}
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-display text-[20px] font-semibold">Novos eventos por mês</h2>
        </div>
        <div className="mb-11 rounded-2xl bg-paper p-7 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
          <div className="flex h-48 items-stretch gap-3">
            {eventsPerMonth.map((s) => (
              <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-[12px] font-semibold text-ink-soft">{s.value}</div>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-accent/85"
                    style={{ height: `${(s.value / maxSeries) * 100}%` }}
                  />
                </div>
                <div className="text-[12px] text-ink-faint">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Eventos ----------------------------------------------------- */}
        <SectionHeader title="Eventos" />
        <TableCard headers={["Evento", "Anfitrião", "Cidade", "Estado", "Link"]} minWidth={720}>
          {events.map((e) => (
            <tr key={e.id} className="border-b border-[rgba(42,39,36,0.06)]">
              <td className="px-6 py-4 text-[15px] font-medium">{e.title}</td>
              <td className="px-6 py-4 text-[14.5px] text-ink-2">{e.hosts || "—"}</td>
              <td className="px-6 py-4 text-[14.5px] text-ink-2">{e.city || "—"}</td>
              <td className="px-6 py-4">
                <Badge tone={e.status === "publicado" ? "accent" : "neutral"}>{e.status}</Badge>
              </td>
              <td className="px-6 py-4">
                <Link
                  href={eventUrl(e)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-[13px] font-semibold text-ink no-underline transition hover:bg-paper-2"
                >
                  Abrir ↗
                </Link>
              </td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <td colSpan={5}className="px-6 py-12 text-center text-[15px] text-ink-faint">
                Nenhum evento cadastrado.
              </td>
            </tr>
          )}
        </TableCard>

        {/* Pessoas ------------------------------------------------------- */}
        <div className="mt-11">
          <SectionHeader title="Contas recentes" />
          <TableCard headers={["Pessoa", "E-mail", "Papel", "Cadastro"]} minWidth={640}>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-[rgba(42,39,36,0.06)]">
                <td className="px-6 py-4 text-[15px] font-medium">{p.displayName}</td>
                <td className="px-6 py-4 text-[14.5px] text-ink-2">{p.email}</td>
                <td className="px-6 py-4">
                  <Badge tone={p.role === "admin" ? "accent" : "neutral"}>
                    {ROLE_LABEL[p.role]}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-[14.5px] text-ink-soft">
                  {shortDate(p.createdAt)}
                </td>
              </tr>
            ))}
          </TableCard>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center">
      <h2 className="font-display text-[20px] font-semibold">{title}</h2>
    </div>
  );
}

function TableCard({
  headers,
  minWidth,
  children,
}: {
  headers: string[];
  minWidth: number;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-paper shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table style={{ minWidth }} className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-ink-faint"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
