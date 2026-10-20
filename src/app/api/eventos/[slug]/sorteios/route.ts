import { NextResponse } from "next/server";
import { createRaffle, listRaffles } from "@/lib/db/raffles";
import { createRaffleSchema } from "@/lib/validation/raffle";
import { loadRaffleEvent, parseBody, raffleErrorResponse } from "./shared";

/** Sorteios do evento — só quem administra (RLS `raffles_manage`). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  try {
    const data = await listRaffles(loaded.supabase, loaded.event.id);
    return NextResponse.json({ data });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadRaffleEvent(slug);
  if (loaded instanceof NextResponse) return loaded;

  const body = await parseBody(req, createRaffleSchema);
  if (body instanceof NextResponse) return body;

  try {
    const id = await createRaffle(loaded.supabase, loaded.event.id, body.data);
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (error) {
    return raffleErrorResponse(error);
  }
}
