import { requireOrganizationMember } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import { listOrganizations } from "@/lib/db/organizations";
import { EmptyState } from "@/components/ui";
import { OrganizacaoPanel } from "./OrganizacaoPanel";

export const metadata = { title: "Painel da organização — Convite" };

export default async function Page() {
  const { supabase } = await requireOrganizationMember("/organizacao");

  // A RLS entrega só as organizações do usuário — ou todas, se for admin.
  const organizations = await listOrganizations(supabase);
  const org = organizations[0];

  if (!org) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-24">
        <EmptyState
          title="Nenhuma organização"
          desc="Sua conta não está vinculada a nenhuma organização parceira."
        />
      </div>
    );
  }

  const events = await listEvents(supabase, { organizationId: org.id });

  return <OrganizacaoPanel org={org} events={events} />;
}
