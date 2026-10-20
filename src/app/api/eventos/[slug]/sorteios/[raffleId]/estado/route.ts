import { NextResponse } from "next/server";
import { runRaffleAction } from "@/lib/db/raffles";
import { raffleActionSchema } from "@/lib/validation/raffle";
import { loadRaffleEvent, parseBody, raffleErrorResponse } from "../../shared";

type Ctx = { params: Promise<{ slug: string; raffleId: string }> };

/**
 * Transições de estado do sorteio:
 * - `iniciar`: bloqueia participantes e prêmios (feito ao começar no palco);
 * - `reabrir`: desbloqueia, só antes do primeiro nome sorteado;
 * - `recomecar`: descarta todos os resultados e desbloqueia;
 * - `encerrar`: fecha o sorteio antes de preencher todas as vagas.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { slug, raffleId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  const body = await parseBody(req, raffleActionSchema);
  if (body instanceof NextResponse) return body;

  try {
    await runRaffleAction(loaded.supabase, loaded.event.id, raffleId, body.data.acao);
    return NextResponse.json({ data: true });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}
