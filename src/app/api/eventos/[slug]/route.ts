import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Evento por slug.
 *
 * Slug inexistente e evento invisível para quem pediu (rascunho ou encerrado,
 * sem vínculo) devolvem exatamente a mesma resposta: um 404 que não revela
 * nada. Distinguir os dois casos entregaria de graça a informação de que
 * aquele endereço está tomado.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: event });
}
