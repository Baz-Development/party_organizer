import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { deleteGift, updateGift } from "@/lib/db/gifts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateGiftSchema } from "@/lib/validation/gift";

/**
 * Edição e remoção de um presente. Mesmo raciocínio de
 * `convidados/[id]/route.ts`: o evento resolve o 404 uniforme, a RLS de
 * `gifts_manage` é quem de fato decide se `giftId` pertence a este evento.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; giftId: string }> },
) {
  const { slug, giftId } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateGiftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const gift = await updateGift(supabase, giftId, parsed.data);
    return NextResponse.json({ data: gift });
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
  { params }: { params: Promise<{ slug: string; giftId: string }> },
) {
  const { slug, giftId } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  try {
    await deleteGift(supabase, giftId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof DbError) {
      const status = error.kind === "nao-encontrado" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
