import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { createGift, listGifts } from "@/lib/db/gifts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createGiftSchema } from "@/lib/validation/gift";

/**
 * Catálogo de presentes de um evento. `listGifts` já devolve `reservedBy`
 * preenchido só para quem administra o evento e vazio para o público — a
 * RLS de `gift_reservations` decide isso, não esta rota.
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

  const data = await listGifts(supabase, event.id);
  return NextResponse.json({ data });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createGiftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  // O arquivo precisa ter sido emitido para este evento (primeiro segmento = event_id).
  if (parsed.data.imagePath && !parsed.data.imagePath.startsWith(`${event.id}/`)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  try {
    const gift = await createGift(supabase, event.id, parsed.data);
    return NextResponse.json({ data: gift }, { status: 201 });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
