import { NextResponse } from "next/server";
import { listEvents } from "@/lib/db/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Lista de eventos, escopada pela RLS: um visitante sem sessão recebe só os
 * publicados; um cliente autenticado recebe também os próprios rascunhos; um
 * admin recebe todos. Não há filtro por dono aqui — quem escopa é o banco.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const data = await listEvents(supabase);

  return NextResponse.json({ data });
}
