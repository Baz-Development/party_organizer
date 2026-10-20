import { NextResponse } from "next/server";
import { deleteRaffle, getRaffle, updateRaffle } from "@/lib/db/raffles";
import { updateRaffleSchema } from "@/lib/validation/raffle";
import { loadRaffleEvent, parseBody, raffleErrorResponse } from "../shared";

type Ctx = { params: Promise<{ slug: string; raffleId: string }> };

/** Sorteio completo: prêmios, participantes e resultados (painel e palco). */
export async function GET(_req: Request, { params }: Ctx) {
  const { slug, raffleId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  try {
    const data = await getRaffle(loaded.supabase, loaded.event.id, raffleId);
    if (!data) return NextResponse.json({ error: "Sorteio não encontrado." }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { slug, raffleId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  const body = await parseBody(req, updateRaffleSchema);
  if (body instanceof NextResponse) return body;

  try {
    await updateRaffle(loaded.supabase, loaded.event.id, raffleId, body.data);
    return NextResponse.json({ data: true });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { slug, raffleId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  try {
    await deleteRaffle(loaded.supabase, loaded.event.id, raffleId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}
