import { requireOrganizationMember } from "@/lib/auth/guards";

/**
 * Guarda do painel da organização.
 *
 * A checagem fica no layout, no servidor: esconder o menu no cliente não
 * impediria ninguém de pedir a rota direto.
 */
export default async function OrganizacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrganizationMember("/organizacao");
  return <>{children}</>;
}
