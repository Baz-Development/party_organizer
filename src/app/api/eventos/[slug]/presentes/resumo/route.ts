import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { getGiftsSummary } from "@/lib/db/gifts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Resumo para o painel do anfitrião: total de presentes, quantos foram
 * presenteados, valor arrecadado — só considerando pagamento confirmado
 * ("Requirement: Acompanhamento no painel"). Sem checagem explícita de posse:
 * a RLS de `gifts`/`payments` já restringe a quem administra o evento; quem
 * não administra recebe zeros, não erro, porque a soma de um conjunto vazio
 * é zero.
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

  const data = await getGiftsSummary(supabase, event.id);
  return NextResponse.json({ data });
}
