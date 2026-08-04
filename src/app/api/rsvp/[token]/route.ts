import { after, NextResponse } from "next/server";
import { RsvpError } from "@/lib/db/errors";
import { getGuestByInviteToken, submitRsvp } from "@/lib/db/guests";
import { enqueueRsvpConfirmationEmail } from "@/lib/email/enqueue";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitRsvpSchema } from "@/lib/validation/rsvp";

/**
 * Prefill do fluxo de RSVP a partir do token na URL. Token inválido, de
 * outro evento, ou adulterado: mesma resposta — o convidado vira visitante
 * anônimo, sem indício do que deu errado.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const supabase = await createSupabaseServerClient();
  const guest = await getGuestByInviteToken(supabase, token);

  if (!guest) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({ data: guest });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const body = await req.json().catch(() => null);
  const parsed = submitRsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const guest = await submitRsvp(supabase, token, parsed.data);

    after(() =>
      enqueueRsvpConfirmationEmail(createSupabaseAdminClient(), guest.id, parsed.data.status, parsed.data),
    );

    return NextResponse.json({ data: guest });
  } catch (error) {
    if (error instanceof RsvpError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
