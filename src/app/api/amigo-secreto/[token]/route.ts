import { NextResponse } from "next/server";
import { SecretSantaError } from "@/lib/db/errors";
import {
  getMySecretSantaParticipation,
  joinSecretSanta,
  updateSecretSantaWishlist,
} from "@/lib/db/secretSanta";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { joinSecretSantaSchema, wishlistSchema } from "@/lib/validation/secretSanta";

/**
 * Adesão e wishlist a partir do token de convite.
 *
 * `POST` decide entre entrar e atualizar a wishlist pelo estado atual do
 * convidado, não pelo formato do corpo — se ele já participa, `displayName`
 * enviado de novo é ignorado e só a wishlist é gravada; senão, adere primeiro
 * e grava a wishlist inicial na sequência, na mesma chamada.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const supabase = await createSupabaseServerClient();
  const participation = await getMySecretSantaParticipation(supabase, token);

  return NextResponse.json({ data: participation });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const body = await req.json().catch(() => null);
  const supabase = await createSupabaseServerClient();

  try {
    const participation = await getMySecretSantaParticipation(supabase, token);

    if (participation) {
      const parsed = wishlistSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
          { status: 400 },
        );
      }
      await updateSecretSantaWishlist(supabase, token, parsed.data.wishlist);
      return NextResponse.json({ data: true });
    }

    const parsed = joinSecretSantaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }

    await joinSecretSanta(supabase, token, parsed.data.displayName);

    const wishlist = wishlistSchema.safeParse(body);
    if (wishlist.success && wishlist.data.wishlist.length > 0) {
      await updateSecretSantaWishlist(supabase, token, wishlist.data.wishlist);
    }

    return NextResponse.json({ data: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SecretSantaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
