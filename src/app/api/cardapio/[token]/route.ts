import { NextResponse } from "next/server";
import { MenuVoteError } from "@/lib/db/errors";
import { getMenuVotesByToken, submitMenuVote } from "@/lib/db/menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitMenuVoteSchema } from "@/lib/validation/menu";

/**
 * Prefill e envio do voto de cardápio a partir do token de convite. As
 * enquetes e opções em si vêm de `getMenuPollsForGuest` (chamada direto pela
 * página, como `loadPublicEvent`) — esta rota só cuida do que depende do
 * convidado identificado: suas escolhas atuais e o envio de novas.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const supabase = await createSupabaseServerClient();
  const votes = await getMenuVotesByToken(supabase, token);

  return NextResponse.json({ data: votes });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const body = await req.json().catch(() => null);
  const parsed = submitMenuVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const optionIds = await submitMenuVote(
      supabase,
      token,
      parsed.data.pollId,
      parsed.data.optionIds,
    );
    return NextResponse.json({ data: optionIds });
  } catch (error) {
    if (error instanceof MenuVoteError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
