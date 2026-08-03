import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { deleteMenuPoll, updateMenuPoll } from "@/lib/db/menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateMenuPollSchema } from "@/lib/validation/menu";

/**
 * Edição e remoção de uma enquete. O evento é resolvido pelo slug antes de
 * qualquer coisa só para produzir o 404 uniforme; quem realmente decide se
 * `id` pertence a este evento é a RLS de `menu_polls_manage` na escrita.
 */
export async function PATCH(
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
  const parsed = updateMenuPollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const poll = await updateMenuPoll(supabase, id, parsed.data);
    return NextResponse.json({ data: poll });
  } catch (error) {
    if (error instanceof DbError) {
      const status = error.kind === "nao-encontrado" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  try {
    await deleteMenuPoll(supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof DbError) {
      const status = error.kind === "nao-encontrado" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
