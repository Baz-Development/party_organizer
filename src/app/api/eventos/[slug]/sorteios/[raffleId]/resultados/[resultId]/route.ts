import { NextResponse } from "next/server";
import { markRaffleResultAbsent } from "@/lib/db/raffles";
import { updateRaffleResultSchema } from "@/lib/validation/raffle";
import { loadRaffleEvent, parseBody, raffleErrorResponse } from "../../../shared";

type Ctx = { params: Promise<{ slug: string; raffleId: string; resultId: string }> };

/** Marca um sorteado como ausente: a vaga do prêmio volta para o próximo sorteio. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { slug, raffleId, resultId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  const body = await parseBody(req, updateRaffleResultSchema);
  if (body instanceof NextResponse) return body;

  try {
    await markRaffleResultAbsent(loaded.supabase, loaded.event.id, raffleId, resultId);
    return NextResponse.json({ data: true });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}
