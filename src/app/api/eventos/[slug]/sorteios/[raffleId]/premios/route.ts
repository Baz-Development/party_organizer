import { NextResponse } from "next/server";
import { createRafflePrize, reorderRafflePrizes } from "@/lib/db/raffles";
import { createRafflePrizeSchema, reorderRafflePrizesSchema } from "@/lib/validation/raffle";
import { loadRaffleEvent, parseBody, raffleErrorResponse } from "../../shared";

type Ctx = { params: Promise<{ slug: string; raffleId: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { slug, raffleId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  const body = await parseBody(req, createRafflePrizeSchema);
  if (body instanceof NextResponse) return body;

  // Mesmo cuidado de presentes: o arquivo precisa ter sido emitido para este evento.
  if (body.data.imagePath && !body.data.imagePath.startsWith(`${loaded.event.id}/`)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  try {
    await createRafflePrize(loaded.supabase, loaded.event.id, raffleId, body.data);
    return NextResponse.json({ data: true }, { status: 201 });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}

/** Reordena: `ids[0]` é o primeiro prêmio sorteado no palco. */
export async function PUT(req: Request, { params }: Ctx) {
  const { slug, raffleId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  const body = await parseBody(req, reorderRafflePrizesSchema);
  if (body instanceof NextResponse) return body;

  try {
    await reorderRafflePrizes(loaded.supabase, loaded.event.id, raffleId, body.data.ids);
    return NextResponse.json({ data: true });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}
