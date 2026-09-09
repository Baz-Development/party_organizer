import { NextResponse } from "next/server";
import { getEventBySlug, setSelfSignup } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { selfSignupUrl } from "@/lib/event-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { selfSignupSchema } from "@/lib/validation/event";

/**
 * Liga ou desliga o link de auto-cadastro do evento (`?lista=<token>`).
 * Escopado pela RLS via `getEventBySlug` + `setSelfSignup` — só quem administra
 * o evento chega até aqui. Ligar de novo rotaciona o token (invalida o antigo).
 */
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
  const parsed = selfSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const updated = await setSelfSignup(supabase, event.id, parsed.data.active);
    return NextResponse.json({
      data: {
        active: updated.selfSignupToken != null,
        url: updated.selfSignupToken ? selfSignupUrl(updated, updated.selfSignupToken) : null,
      },
    });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
