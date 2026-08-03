import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { createMenuOption } from "@/lib/db/menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMenuOptionSchema } from "@/lib/validation/menu";

/**
 * Adiciona uma opção a uma enquete existente. `id` é o `poll_id` — a RLS de
 * `menu_options_manage` decide se ele pertence a um evento que quem chama
 * administra.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createMenuOptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const option = await createMenuOption(supabase, id, parsed.data);
    return NextResponse.json({ data: option }, { status: 201 });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
