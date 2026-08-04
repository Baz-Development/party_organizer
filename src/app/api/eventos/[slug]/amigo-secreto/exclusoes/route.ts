import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { SecretSantaError } from "@/lib/db/errors";
import {
  addSecretSantaExclusion,
  listSecretSantaExclusions,
  removeSecretSantaExclusion,
} from "@/lib/db/secretSanta";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addSecretSantaExclusionSchema } from "@/lib/validation/secretSanta";

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

  const data = await listSecretSantaExclusions(supabase, event.id);
  return NextResponse.json({ data });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = addSecretSantaExclusionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    await addSecretSantaExclusion(
      supabase,
      event.id,
      parsed.data.participantAId,
      parsed.data.participantBId,
    );
    return NextResponse.json({ data: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SecretSantaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const exclusionId = searchParams.get("id");
  if (!exclusionId) {
    return NextResponse.json({ error: "Informe a restrição a remover." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    await removeSecretSantaExclusion(supabase, exclusionId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SecretSantaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
