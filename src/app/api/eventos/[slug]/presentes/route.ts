import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { GIFTS } from "@/lib/fixtures/gifts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GiftStatus } from "@/lib/types";

/**
 * O evento vem do banco; a **lista de presentes** ainda é fixture, até o
 * change `add-gifts-payments-backend`.
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

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as GiftStatus | null;
  const category = url.searchParams.get("categoria");

  const data = GIFTS.filter((g) => !status || g.status === status).filter(
    (g) => !category || g.category === category,
  );

  return NextResponse.json({ data });
}
