import { NextResponse } from "next/server";
import { getEventBySlug, setEventCover } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { confirmCoverUploadSchema } from "@/lib/validation/media";

/** Confirma o upload da capa (ou limpa, com `storagePath: null`). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const body = await req.json().catch(() => null);
  const parsed = confirmCoverUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  try {
    const updated = await setEventCover(supabase, event.id, parsed.data.storagePath);
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.kind === "nao-encontrado" ? 404 : 400 },
      );
    }
    throw error;
  }
}
