import { PanelNav } from "@/components/PanelNav";
import { SairButton } from "@/components/SairButton";
import { requireAdmin } from "@/lib/auth/guards";
import { listClientAccounts } from "@/lib/db/clients";
import { themeVars } from "@/lib/themes";
import { ADMIN_NAV } from "../nav";
import { ClientesManager } from "./ClientesManager";

export const metadata = { title: "Clientes — Admin" };

export default async function AdminClientesPage() {
  const { supabase } = await requireAdmin("/admin/clientes");
  const clientes = await listClientAccounts(supabase);

  return (
    <div style={themeVars({ themeKey: "dourado" })} className="min-h-screen bg-paper-3">
      <PanelNav brand="Admin" items={ADMIN_NAV} right={<SairButton />} />
      <div className="mx-auto max-w-[1160px] px-6 py-10 pb-16">
        <div className="mb-8">
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">Plataforma</div>
          <h1 className="font-display text-[30px] font-semibold">Contas de cliente</h1>
        </div>
        <ClientesManager clientes={clientes} />
      </div>
    </div>
  );
}
