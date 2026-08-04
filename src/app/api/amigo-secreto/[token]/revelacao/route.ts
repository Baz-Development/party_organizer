import { NextResponse } from "next/server";
import { SecretSantaError } from "@/lib/db/errors";
import { getMySecretSanta } from "@/lib/db/secretSanta";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Revelação do participante identificado pelo token. `get_my_secret_santa`
 * já registra a revelação na mesma chamada — esta rota só repassa o
 * resultado, sem tocar em `secret_santa_assignments`/`secret_santa_reveals`
 * diretamente.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const supabase = await createSupabaseServerClient();

  try {
    const reveal = await getMySecretSanta(supabase, token);
    return NextResponse.json({ data: reveal });
  } catch (error) {
    if (error instanceof SecretSantaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
