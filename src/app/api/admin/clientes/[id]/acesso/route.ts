import { after, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { enqueueEmail } from "@/lib/email/enqueue";
import { processEmailQueue } from "@/lib/email/processQueue";
import { createSupabaseAdminClient, getUserEmail } from "@/lib/supabase/admin";
import { sendClientAccessSchema } from "@/lib/validation/client";

/**
 * Reenvia manualmente o e-mail de acesso ao painel para uma conta de cliente
 * já provisionada. Só o admin — espelha o disparo automático de
 * `POST /api/eventos`, mas acionado pela tela `/admin/clientes` quando o
 * e-mail original falhou ou se perdeu.
 *
 * A mensagem é sempre ligada a um evento (`email_messages.event_id` é NOT
 * NULL): usa o `eventId` do corpo, ou o evento mais recente em que a conta é
 * anfitriã. Cliente sem nenhuma página → 409.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = sendClientAccessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { data: profile } = await guard.supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle();

  if (!profile || profile.role !== "cliente") {
    return NextResponse.json(
      { error: "A conta informada não é um cliente válido." },
      { status: 400 },
    );
  }

  const recipientEmail = await getUserEmail(id);
  if (!recipientEmail) {
    return NextResponse.json(
      { error: "Este cliente não tem e-mail de acesso cadastrado." },
      { status: 400 },
    );
  }

  let eventQuery = guard.supabase
    .from("events")
    .select("id, slug, title")
    .eq("host_profile_id", id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (parsed.data.eventId) {
    eventQuery = guard.supabase
      .from("events")
      .select("id, slug, title")
      .eq("host_profile_id", id)
      .eq("id", parsed.data.eventId)
      .limit(1);
  }

  const { data: events, error: eventError } = await eventQuery;
  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  const event = events?.[0];
  if (!event) {
    return NextResponse.json(
      {
        error: parsed.data.eventId
          ? "Evento não encontrado para este cliente."
          : "Este cliente ainda não tem uma página para referenciar no e-mail.",
      },
      { status: 409 },
    );
  }

  const admin = createSupabaseAdminClient();
  await enqueueEmail(admin, {
    eventId: event.id,
    recipientEmail,
    template: "acesso_painel",
    data: {
      eventTitle: event.title,
      eventSlug: event.slug,
      eventId: event.id,
      loginEmail: recipientEmail,
    },
  });
  after(() => processEmailQueue(admin));

  return NextResponse.json({ ok: true, recipientEmail }, { status: 202 });
}
