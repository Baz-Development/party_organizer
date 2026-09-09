import { PanelNav } from "@/components/PanelNav";
import { SairButton } from "@/components/SairButton";
import { requireAdmin } from "@/lib/auth/guards";
import { listClientAccounts } from "@/lib/db/clients";
import { listEvents } from "@/lib/db/events";
import { themeVars } from "@/lib/themes";
import { ADMIN_NAV } from "../nav";
import { EventosBuscador } from "./EventosBuscador";

export const metadata = { title: "Eventos — Admin" };

export default async function AdminEventosPage() {
  const { supabase } = await requireAdmin("/admin/eventos");

  const [events, clientes] = await Promise.all([
    listEvents(supabase),
    listClientAccounts(supabase),
  ]);

  return (
    <div style={themeVars("dourado")} className="min-h-screen bg-paper-3">
      <PanelNav brand="Admin" items={ADMIN_NAV} right={<SairButton />} />
      <div className="mx-auto max-w-[1160px] px-6 py-10 pb-16">
        <div className="mb-8">
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">Plataforma</div>
          <h1 className="font-display text-[30px] font-semibold">Eventos</h1>
          <p className="mt-2 text-[14.5px] text-ink-soft">
            Busque por título, cidade ou anfitrião, filtre por cliente, ou veja tudo num calendário.
          </p>
        </div>
        <EventosBuscador
          events={events}
          clientes={clientes.map((c) => ({ id: c.id, label: `${c.displayName} · ${c.email}` }))}
        />
      </div>
    </div>
  );
}
