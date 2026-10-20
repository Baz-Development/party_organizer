import { NextResponse } from "next/server";
import { setRaffleParticipants } from "@/lib/db/raffles";
import { setRaffleParticipantsSchema } from "@/lib/validation/raffle";
import { loadRaffleEvent, parseBody, raffleErrorResponse } from "../../shared";

type Ctx = { params: Promise<{ slug: string; raffleId: string }> };

/**
 * Substitui a lista de participantes pelos convidados marcados. Responde 409
 * (`sorteio_bloqueado`) depois que a anfitriã começou o sorteio.
 */
export async function PUT(req: Request, { params }: Ctx) {
  const { slug, raffleId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  const body = await parseBody(req, setRaffleParticipantsSchema);
  if (body instanceof NextResponse) return body;

  try {
    await setRaffleParticipants(loaded.supabase, loaded.event.id, raffleId, body.data.guestIds);
    return NextResponse.json({ data: true });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}
