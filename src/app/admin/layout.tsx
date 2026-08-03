import { requireAdmin } from "@/lib/auth/guards";

/**
 * Guarda do painel administrativo: exige papel de admin da plataforma.
 *
 * Um cliente autenticado que peça esta rota recebe 403 — nenhum dado da
 * plataforma chega a ser consultado.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/admin");
  return <>{children}</>;
}
