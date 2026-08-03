"use client";

import Link from "next/link";
import { PanelNav } from "@/components/PanelNav";
import { SairButton } from "@/components/SairButton";
import { Badge } from "@/components/ui";
import { ADMIN_SERIES, PLATFORM_FINANCE } from "@/lib/fixtures/painel";
import { shortDate } from "@/lib/format";
import { themeVars } from "@/lib/themes";
import type { EventSummary, Organization, Profile } from "@/lib/types";

const PLAN_LABEL: Record<Organization["plan"], string> = {
  parceiro: "Parceiro",
  premium: "Premium",
  enterprise: "Enterprise",
};

const ROLE_LABEL: Record<Profile["role"], string> = {
  cliente: "Cliente",
  organizacao: "Organização",
  admin: "Admin",
};

export function AdminPanel({
  organizations,
  events,
  profiles,
}: {
  organizations: Organization[];
  events: EventSummary[];
  profiles: Profile[];
}) {
  const maxSeries = Math.max(...ADMIN_SERIES.map((s) => s.value));

  const eventosAtivos = events.filter((e) => e.status === "publicado").length;
  const rascunhos = events.filter((e) => e.status === "rascunho").length;

  /**
   * As duas primeiras métricas são contadas do banco. As financeiras seguem
   * de fixture — não existe billing — e por isso vêm marcadas como estimadas,
   * em vez de se passarem por número real.
   */
  const metrics = [
    {
      label: "Eventos ativos",
      value: String(eventosAtivos),
      hint: `${events.length} no total · ${rascunhos} em rascunho`,
      real: true,
    },
    {
      label: "Organizações",
      value: String(organizations.length),
      hint: `${profiles.length} pessoas com conta`,
      real: true,
    },
    {
      label: "MRR",
      value: PLATFORM_FINANCE.receitaMes,
      hint: `${PLATFORM_FINANCE.crescimento} vs. mês passado`,
      real: false,
    },
    {
      label: "Ticket médio",
      value: PLATFORM_FINANCE.ticketMedio,
      hint: `${PLATFORM_FINANCE.convidadosMes.toLocaleString("pt-BR")} convidados no mês`,
      real: false,
    },
  ];

  return (
    <div style={themeVars("terracota")} className="min-h-screen bg-paper-3">
      <PanelNav
        brand="Convite · Admin"
        items={[
          { href: "/admin", label: "Visão geral" },
          { href: "/organizacao", label: "Organizações" },
          { href: "/painel", label: "Painel do cliente" },
        ]}
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
          <Badge>estimado</Badge>
        </div>
        <div className="mb-11 rounded-2xl bg-paper p-7 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
          <div className="flex h-48 items-end gap-3">
            {ADMIN_SERIES.map((s) => (
              <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-[12px] font-semibold text-ink-soft">{s.value}</div>
                <div
                  className="w-full rounded-t-md bg-accent/85"
                  style={{ height: `${(s.value / maxSeries) * 100}%` }}
                />
                <div className="text-[12px] text-ink-faint">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Organizações -------------------------------------------------- */}
        <SectionHeader title="Organizações parceiras" href="/organizacao" cta="Ver painel" />
        <TableCard
          headers={["Organização", "Cidade", "Plano", "Eventos ativos", "Total", "Desde"]}
          minWidth={760}
        >
          {organizations.map((o) => (
            <tr key={o.id} className="border-b border-[rgba(42,39,36,0.06)]">
              <td className="px-6 py-4 text-[15px] font-medium">{o.name}</td>
              <td className="px-6 py-4 text-[14.5px] text-ink-2">{o.city || "—"}</td>
              <td className="px-6 py-4">
                <Badge tone={o.plan === "enterprise" ? "accent" : "neutral"}>
                  {PLAN_LABEL[o.plan]}
                </Badge>
              </td>
              <td className="px-6 py-4 text-[14.5px] text-ink-2">{o.activeEvents}</td>
              <td className="px-6 py-4 text-[14.5px] text-ink-2">{o.events}</td>
              <td className="px-6 py-4 text-[14.5px] text-ink-soft">{shortDate(o.since)}</td>
            </tr>
          ))}
          {organizations.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-[15px] text-ink-faint">
                Nenhuma organização cadastrada.
              </td>
            </tr>
          )}
        </TableCard>

        {/* Pessoas ------------------------------------------------------- */}
        <div className="mt-11">
          <SectionHeader title="Contas recentes" href="/painel" cta="Painel do cliente" />
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

function SectionHeader({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-[20px] font-semibold">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-accent no-underline">
        {cta}
      </Link>
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
