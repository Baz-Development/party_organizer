import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { deleteGuest, updateGuest } from "@/lib/db/guests";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateGuestSchema } from "@/lib/validation/guest";

/**
 * Edição e remoção de um convidado. O evento é resolvido pelo slug antes de
 * qualquer coisa só para produzir o 404 uniforme; quem realmente decide se
 * `id` pertence a este evento é a RLS de `guests_manage` na escrita.
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
  const parsed = updateGuestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const guest = await updateGuest(supabase, id, {
      name: parsed.data.name,
      group: parsed.data.group,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone,
    });
    return NextResponse.json({ data: guest });
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
    await deleteGuest(supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof DbError) {
      const status = error.kind === "nao-encontrado" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
