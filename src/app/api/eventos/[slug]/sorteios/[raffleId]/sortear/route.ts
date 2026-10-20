import { NextResponse } from "next/server";
import { drawRaffleWinner } from "@/lib/db/raffles";
import { loadRaffleEvent, raffleErrorResponse } from "../../shared";

type Ctx = { params: Promise<{ slug: string; raffleId: string }> };

/**
 * Sorteia o próximo nome. Quem escolhe o vencedor e a vaga é o banco
 * (`draw_raffle_winner`); o palco só recebe o resultado e anima até ele.
 */
export async function POST(_req: Request, { params }: Ctx) {
  const { slug, raffleId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  try {
    const data = await drawRaffleWinner(loaded.supabase, loaded.event.id, raffleId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}
