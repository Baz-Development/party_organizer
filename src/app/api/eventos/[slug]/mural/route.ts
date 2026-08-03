import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { listMuralMessages, submitMuralMessage } from "@/lib/db/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { galleryQuerySchema, submitMuralMessageSchema } from "@/lib/validation/media";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const url = new URL(req.url);
  const parsedQuery = galleryQuerySchema.safeParse({
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Parâmetros de paginação inválidos." }, { status: 400 });
  }

  const statusParam = url.searchParams.get("status");
  const status =
    statusParam === "pendente" || statusParam === "aprovada" || statusParam === "oculta"
      ? statusParam
      : undefined;

  const page = await listMuralMessages(supabase, event.id, { ...parsedQuery.data, status });
  return NextResponse.json({ data: page.items, nextCursor: page.nextCursor });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const body = await req.json().catch(() => null);
  const parsed = submitMuralMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const message = await submitMuralMessage(supabase, slug, parsed.data);
    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
