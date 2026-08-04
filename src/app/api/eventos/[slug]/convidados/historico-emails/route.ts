import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { listEmailHistory } from "@/lib/db/emails";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Histórico de mensagens do evento, para a tela de acompanhamento de
 * `/painel/convidados`. Escopado pela RLS via `getEventBySlug`/
 * `listEmailHistory`: um membro de outra organização recebe "evento não
 * encontrado", igual às demais rotas do painel.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const history = await listEmailHistory(supabase, event.id);
  return NextResponse.json({ data: history });
}
