import { after, NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { enqueueEmail } from "@/lib/email/enqueue";
import { processEmailQueue } from "@/lib/email/processQueue";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendGuestInvitesSchema } from "@/lib/validation/email";

/**
 * Disparo em lote de convites. `guestIds` explícito, ou omitido para "todos
 * os pendentes" (quem ainda não respondeu o RSVP). Escopado pela RLS via
 * `getEventBySlug` — só quem administra o evento chega até aqui
 * ("Requirement: Disparo em lote com acompanhamento", cenário "Disparo
 * restrito").
 *
 * Convidado sem e-mail: reportado em `naoEnviaveis`, sem falhar o resto do
 * lote ("Requirement: Disparo em lote com acompanhamento", cenário
 * "Convidado sem e-mail"). A resposta não espera a entrega — só o
 * enfileiramento — e `after()` processa best-effort em seguida.
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

  const body = await req.json().catch(() => ({}));
  const parsed = sendGuestInvitesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  let guestsQuery = supabase.from("guests").select("id, name, email").eq("event_id", event.id);
  guestsQuery = parsed.data.guestIds?.length
    ? guestsQuery.in("id", parsed.data.guestIds)
    : guestsQuery.eq("status", "pendente");

  const { data: guests, error } = await guestsQuery;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const isInvitable = (g: { email: string | null }): g is { id: string; name: string; email: string } =>
    !!g.email;
  const enviaveis = (guests ?? []).filter(isInvitable);
  const naoEnviaveis = (guests ?? [])
    .filter((g) => !g.email)
    .map((g) => ({ guestId: g.id, name: g.name }));

  const admin = createSupabaseAdminClient();
  for (const guest of enviaveis) {
    await enqueueEmail(admin, {
      eventId: event.id,
      recipientEmail: guest.email,
      template: "convite",
      data: { eventTitle: event.title, eventSlug: event.slug, guestName: guest.name, guestId: guest.id },
    });
  }

  if (enviaveis.length > 0) after(() => processEmailQueue(admin));

  return NextResponse.json({
    data: { enfileirados: enviaveis.length, naoEnviaveis },
  });
}
