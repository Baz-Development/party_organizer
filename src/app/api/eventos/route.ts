import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { DbError, SlugConflictError } from "@/lib/db/errors";
import { createEvent, listEvents } from "@/lib/db/events";
import { createEventByAdminSchema } from "@/lib/validation/event";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Lista de eventos, escopada pela RLS: um visitante sem sessão recebe só os
 * publicados; um cliente autenticado recebe também os próprios rascunhos; um
 * admin recebe todos. Não há filtro por dono aqui — quem escopa é o banco.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const data = await listEvents(supabase);

  return NextResponse.json({ data });
}

/**
 * Cria a página de evento. Só o admin: ele informa os dados da festa e a conta
 * de cliente que será anfitriã. O evento nasce em rascunho.
 */
export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createEventByAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { hostProfileId, ...eventInput } = parsed.data;

  // Mensagem clara para "anfitrião inexistente" em vez de deixar só a RLS
  // recusar o insert com um erro genérico.
  const { data: host } = await guard.supabase
    .from("profiles")
    .select("role")
    .eq("id", hostProfileId)
    .maybeSingle();

  if (!host || host.role !== "cliente") {
    return NextResponse.json(
      { error: "A conta anfitriã informada não é um cliente válido." },
      { status: 400 },
    );
  }

  try {
    const event = await createEvent(guard.supabase, eventInput, hostProfileId);
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    if (error instanceof SlugConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
