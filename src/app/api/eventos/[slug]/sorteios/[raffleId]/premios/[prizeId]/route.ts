import { NextResponse } from "next/server";
import { deleteRafflePrize, updateRafflePrize } from "@/lib/db/raffles";
import { updateRafflePrizeSchema } from "@/lib/validation/raffle";
import { loadRaffleEvent, parseBody, raffleErrorResponse } from "../../../shared";

type Ctx = { params: Promise<{ slug: string; raffleId: string; prizeId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { slug, raffleId, prizeId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  const body = await parseBody(req, updateRafflePrizeSchema);
  if (body instanceof NextResponse) return body;

  if (body.data.imagePath && !body.data.imagePath.startsWith(`${loaded.event.id}/`)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  try {
    await updateRafflePrize(loaded.supabase, loaded.event.id, raffleId, prizeId, body.data);
    return NextResponse.json({ data: true });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { slug, raffleId, prizeId } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  try {
    await deleteRafflePrize(loaded.supabase, loaded.event.id, raffleId, prizeId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}
