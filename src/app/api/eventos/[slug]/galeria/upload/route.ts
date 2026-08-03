import { NextResponse } from "next/server";
import { requestPhotoUpload } from "@/lib/db/media";
import { DbError } from "@/lib/db/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requestPhotoUploadSchema } from "@/lib/validation/media";

/**
 * Emite a URL de upload assinada de uma foto. Não recebe o arquivo — o
 * navegador envia direto ao Storage com a URL devolvida aqui, de uso único e
 * validade curta (ver `requestPhotoUpload`).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const body = await req.json().catch(() => null);
  const parsed = requestPhotoUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const result = await requestPhotoUpload(
      supabase,
      slug,
      parsed.data.visitorId,
      parsed.data.contentType,
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
