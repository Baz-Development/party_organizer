import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { importGuests } from "@/lib/db/guests";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { importGuestsSchema } from "@/lib/validation/guest";

/** Importação em lote: linhas válidas gravam, linhas inválidas voltam com o motivo. */
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
  const parsed = importGuestsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const result = await importGuests(supabase, event, parsed.data.rows);
    return NextResponse.json({ data: result.accepted, rejected: result.rejected });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
