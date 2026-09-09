import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelNav } from "@/components/PanelNav";
import { SairButton } from "@/components/SairButton";
import { requireAdmin } from "@/lib/auth/guards";
import { getEventBySlug } from "@/lib/db/events";
import { themeVars } from "@/lib/themes";
import { EditorForm } from "@/app/painel/editor/EditorForm";
import { ADMIN_NAV } from "../../../nav";

export const metadata = { title: "Editor da página — Admin" };

/**
 * Mesmo editor da página que o anfitrião usa, aberto para o admin sobre
 * qualquer evento da plataforma. A escrita passa por `salvarEditor`, que
 * confia na RLS — e as políticas abrem tudo para `is_platform_admin()`.
 */
export default async function AdminEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase } = await requireAdmin(`/admin/eventos/${slug}/editor`);

  const event = await getEventBySlug(supabase, slug);
  if (!event) notFound();

  return (
    <div style={themeVars({ themeKey: "dourado" })} className="min-h-screen bg-paper-3">
      <PanelNav
        brand="Admin"
        items={ADMIN_NAV}
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/eventos"
              className="rounded-lg border border-line-strong px-3.5 py-2 text-[13.5px] font-semibold text-ink no-underline hover:bg-paper-2"
            >
              ← Eventos
            </Link>
            <SairButton />
          </div>
        }
      />
      <EditorForm event={event} />
    </div>
  );
}
