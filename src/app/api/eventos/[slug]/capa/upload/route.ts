import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { requestCoverUpload } from "@/lib/db/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requestCoverUploadSchema } from "@/lib/validation/media";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const body = await req.json().catch(() => null);
  const parsed = requestCoverUploadSchema.safeParse(body);
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
    const result = await requestCoverUpload(supabase, event.id, parsed.data.contentType);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.kind === "nao-encontrado" ? 403 : 400 },
      );
    }
    throw error;
  }
}
