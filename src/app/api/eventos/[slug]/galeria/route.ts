import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { confirmPhotoUpload, listPhotos } from "@/lib/db/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { confirmPhotoUploadSchema, galleryQuerySchema } from "@/lib/validation/media";

/**
 * Lista fotos do evento, paginada por cursor de `created_at`. A RLS decide o
 * que aparece: público só vê aprovadas de evento publicado, quem administra
 * vê tudo — a rota não filtra por papel, só repassa o que a política
 * devolveu.
 */
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

  const page = await listPhotos(supabase, event.id, { ...parsedQuery.data, status });
  return NextResponse.json({ data: page.items, nextCursor: page.nextCursor });
}

/** Confirma um upload já concluído no Storage e cria o registro da foto. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const body = await req.json().catch(() => null);
  const parsed = confirmPhotoUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const photo = await confirmPhotoUpload(supabase, slug, parsed.data);
    return NextResponse.json({ data: photo }, { status: 201 });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
