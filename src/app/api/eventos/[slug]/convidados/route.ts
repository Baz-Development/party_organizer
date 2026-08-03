import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { GUESTS, guestStats } from "@/lib/fixtures/guests";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RsvpStatus } from "@/lib/types";

/**
 * O evento já vem do banco — o slug é verificado de verdade. A **lista de
 * convidados** ainda é fixture: as tabelas de convidados e RSVP chegam no
 * change `add-guests-rsvp-backend`.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  if (!(await getEventBySlug(supabase, slug))) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const status = new URL(req.url).searchParams.get("status") as RsvpStatus | null;
  const data = status ? GUESTS.filter((g) => g.status === status) : GUESTS;

  return NextResponse.json({ data, stats: guestStats(GUESTS) });
}

/** Mock: aceita um RSVP e devolve o que seria gravado, sem persistir nada. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  if (!(await getEventBySlug(supabase, slug))) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Informe o nome do convidado" }, { status: 400 });
  }

  return NextResponse.json(
    {
      data: {
        id: `mock-${Date.now()}`,
        name: body.name,
        status: body.attending === false ? "recusado" : "confirmado",
        companions: body.companions ?? 0,
        kids: body.kids ?? 0,
        dietary: body.dietary ?? null,
        respondedAt: new Date().toISOString(),
      },
      persisted: false,
    },
    { status: 201 },
  );
}
