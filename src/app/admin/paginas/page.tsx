import { PanelNav } from "@/components/PanelNav";
import { SairButton } from "@/components/SairButton";
import { requireAdmin } from "@/lib/auth/guards";
import { listClientAccounts } from "@/lib/db/clients";
import { themeVars } from "@/lib/themes";
import { ADMIN_NAV } from "../nav";
import { NovaPaginaForm } from "./NovaPaginaForm";

export const metadata = { title: "Nova página — Admin" };

export default async function AdminNovaPaginaPage() {
  const { supabase } = await requireAdmin("/admin/paginas");
  const clientes = await listClientAccounts(supabase);

  return (
    <div style={themeVars("dourado")} className="min-h-screen bg-paper-3">
      <PanelNav brand="Admin" items={ADMIN_NAV} right={<SairButton />} />
      <div className="mx-auto max-w-[720px] px-6 py-10 pb-16">
        <div className="mb-8">
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">Plataforma</div>
          <h1 className="font-display text-[30px] font-semibold">Nova página de evento</h1>
          <p className="mt-2 text-[14.5px] text-ink-soft">
            A página nasce em rascunho, vinculada à conta de cliente anfitriã.
          </p>
        </div>
        <NovaPaginaForm
          clientes={clientes.map((c) => ({ id: c.id, label: `${c.displayName} · ${c.email}` }))}
        />
      </div>
    </div>
  );
}
