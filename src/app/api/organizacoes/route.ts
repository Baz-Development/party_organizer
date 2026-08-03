import { NextResponse } from "next/server";
import { listOrganizations } from "@/lib/db/organizations";
import { ADMIN_SERIES, PLATFORM_FINANCE } from "@/lib/fixtures/painel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Organizações visíveis para quem pediu.
 *
 * Diferente de `/api/eventos`, aqui não há nada público: organização é dado de
 * gestão. Sem sessão a resposta é 401 — não uma lista vazia, que sugeriria que
 * o pedido foi atendido e simplesmente não havia nada.
 *
 * Com sessão, a RLS escopa: as próprias organizações, ou todas, para admin.
 *
 * `metrics` mistura o que é real com o que ainda não é: contagem de
 * organizações e de eventos ativos vem do banco; faturamento e ticket médio
 * continuam de fixture porque billing não existe.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  }

  const data = await listOrganizations(supabase);

  return NextResponse.json({
    data,
    metrics: {
      eventosAtivos: data.reduce((total, org) => total + org.activeEvents, 0),
      organizacoes: data.length,
      ...PLATFORM_FINANCE,
    },
    series: ADMIN_SERIES,
  });
}
