import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unsubscribeSchema } from "@/lib/validation/email";

/**
 * Descadastro sem conta: chama `unsubscribe_email` (`security definer`,
 * grant a `anon, authenticated`) — funciona também para quem chegou aqui
 * pelo link da mensagem, sem sessão nenhuma.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const body = await req.json().catch(() => null);
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const { error } = await supabase.rpc("unsubscribe_email", {
    p_event_id: event.id,
    p_email: parsed.data.email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: true });
}
