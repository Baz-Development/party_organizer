import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { deleteMenuOption } from "@/lib/db/menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Remove uma opção de enquete. Se ela já tiver voto, a spec exige
 * confirmação explícita — o caller precisa repetir a chamada com
 * `?force=true`; sem o parâmetro, a rota devolve 409.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string; optionId: string }> },
) {
  const { slug, optionId } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const force = new URL(req.url).searchParams.get("force") === "true";

  try {
    await deleteMenuOption(supabase, optionId, { force });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof DbError) {
      const status =
        error.kind === "nao-encontrado" ? 404 : error.kind === "conflito" ? 409 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
