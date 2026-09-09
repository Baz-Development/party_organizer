import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { exportGuests } from "@/lib/db/guests";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Exportação da lista completa. A RLS já garante que só quem administra o
 * evento recebe dados — sem vínculo, `exportGuests` volta lista vazia, que
 * aqui vira o mesmo 404 uniforme de sempre.
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  }

  const guests = await exportGuests(supabase, event);

  return NextResponse.json({ data: guests });
}
