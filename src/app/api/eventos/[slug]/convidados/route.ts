import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { computeGuestStats, createGuest, listGuests } from "@/lib/db/guests";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createGuestSchema, guestStatusFilterSchema } from "@/lib/validation/guest";

/**
 * Lista de convidados de um evento, escopada pela RLS: só quem administra o
 * evento recebe algo — um visitante ou o dono de outro evento recebe a
 * mesma resposta de "evento não encontrado" que um slug inexistente.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const statusParam = new URL(req.url).searchParams.get("status");
  const parsedStatus = statusParam ? guestStatusFilterSchema.safeParse(statusParam) : null;
  if (statusParam && !parsedStatus?.success) {
    return NextResponse.json({ error: "Estado de resposta desconhecido." }, { status: 400 });
  }

  const guests = await listGuests(supabase, event.id, { status: parsedStatus?.data });
  const all = statusParam ? await listGuests(supabase, event.id) : guests;

  return NextResponse.json({ data: guests, stats: computeGuestStats(all) });
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
  const parsed = createGuestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const guest = await createGuest(supabase, event.id, {
      name: parsed.data.name,
      group: parsed.data.group,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone,
    });
    return NextResponse.json({ data: guest }, { status: 201 });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
