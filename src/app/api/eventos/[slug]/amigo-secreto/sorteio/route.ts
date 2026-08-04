import { after, NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { SecretSantaError } from "@/lib/db/errors";
import { redoSecretSantaDraw, runSecretSantaDraw } from "@/lib/db/secretSanta";
import { enqueueEmail } from "@/lib/email/enqueue";
import { processEmailQueue } from "@/lib/email/processQueue";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * `POST` executa o sorteio pela primeira vez; `PUT` refaz um sorteio
 * existente (bloqueado assim que alguém revelou). Duas rotas HTTP em vez de
 * uma flag no corpo, porque são operações com pré-condições diferentes
 * (nenhum sorteio vs. sorteio sem revelações).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  try {
    await runSecretSantaDraw(supabase, event.id);

    after(() => enqueueRevealEmails(event.id, event.slug, event.title));

    return NextResponse.json({ data: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SecretSantaError) {
      const status = error.code === "sorteio_ja_realizado" ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  try {
    await redoSecretSantaDraw(supabase, event.id);

    after(() => enqueueRevealEmails(event.id, event.slug, event.title));

    return NextResponse.json({ data: true });
  } catch (error) {
    if (error instanceof SecretSantaError) {
      const status = error.code === "ja_revelado_recusa" ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}

/**
 * Enfileira o link de revelação para cada participante com e-mail. NUNCA
 * inclui o nome de quem foi sorteado — só `guestId`, resolvido para o token
 * de convite dentro de `processQueue.ts` na hora de montar o link (design.md
 * do change `add-secret-santa-backend`, "Requirement: Sigilo dos pares").
 */
async function enqueueRevealEmails(eventId: string, eventSlug: string, eventTitle: string): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { data: participants } = await admin
    .from("secret_santa_participants")
    .select("guest_id, guests(email)")
    .eq("event_id", eventId);

  const withEmail = (participants ?? []).filter(
    (p): p is typeof p & { guests: { email: string } } => !!p.guests?.email,
  );

  for (const participant of withEmail) {
    await enqueueEmail(admin, {
      eventId,
      recipientEmail: participant.guests.email,
      template: "revelacao_amigo_secreto",
      data: { eventTitle, eventSlug, guestId: participant.guest_id },
    });
  }

  if (withEmail.length > 0) await processEmailQueue(admin);
}
