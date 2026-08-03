import { NextResponse } from "next/server";
import { DbError } from "@/lib/db/errors";
import { reactToItem } from "@/lib/db/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reactSchema } from "@/lib/validation/media";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = reactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const likes = await reactToItem(supabase, "recado", id, parsed.data.visitorId);
    return NextResponse.json({ data: { likes } });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
