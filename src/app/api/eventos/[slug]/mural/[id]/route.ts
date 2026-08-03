import { NextResponse } from "next/server";
import { DbError } from "@/lib/db/errors";
import { deleteMuralMessage, moderateMuralMessage } from "@/lib/db/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderateItemSchema } from "@/lib/validation/media";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = moderateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const message = await moderateMuralMessage(supabase, id, parsed.data.status);
    return NextResponse.json({ data: message });
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  try {
    await deleteMuralMessage(supabase, id);
    return new NextResponse(null, { status: 204 });
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
