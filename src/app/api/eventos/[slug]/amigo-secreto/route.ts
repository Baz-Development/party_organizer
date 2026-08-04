import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { SecretSantaError } from "@/lib/db/errors";
import { listSecretSantaParticipants, getSecretSantaStatus } from "@/lib/db/secretSanta";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Lista de participantes e status para quem administra o evento. Nunca
 * devolve um par — `listSecretSantaParticipants`/`getSecretSantaStatus` só
 * alcançam o que a RLS e as funções `security definer` expõem para essa
 * identidade.
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

  try {
    const [participants, status] = await Promise.all([
      listSecretSantaParticipants(supabase, event.id),
      getSecretSantaStatus(supabase, event.id),
    ]);

    return NextResponse.json({ data: { participants, status } });
  } catch (error) {
    if (error instanceof SecretSantaError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
