import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { createMenuPoll, listMenuPolls } from "@/lib/db/menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMenuPollSchema } from "@/lib/validation/menu";

/**
 * Curadoria de enquetes de cardápio de um evento, escopada pela RLS: só
 * quem administra o evento recebe algo — igual ao padrão de
 * `convidados/route.ts`.
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

  const polls = await listMenuPolls(supabase, event.id);
  return NextResponse.json({ data: polls });
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
  const parsed = createMenuPollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const poll = await createMenuPoll(supabase, event.id, parsed.data);
    return NextResponse.json({ data: poll }, { status: 201 });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
