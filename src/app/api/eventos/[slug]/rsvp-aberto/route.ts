import { after, NextResponse } from "next/server";
import { RsvpError } from "@/lib/db/errors";
import { submitOpenRsvp } from "@/lib/db/guests";
import { enqueueRsvpConfirmationEmail } from "@/lib/email/enqueue";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitOpenRsvpSchema } from "@/lib/validation/rsvp";

/**
 * RSVP de quem não está na lista, só aceito quando o evento tem lista
 * aberta habilitada — `submit_open_rsvp` recusa o resto.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const body = await req.json().catch(() => null);
  const parsed = submitOpenRsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const guest = await submitOpenRsvp(supabase, slug, parsed.data.name, parsed.data);

    after(() =>
      enqueueRsvpConfirmationEmail(createSupabaseAdminClient(), guest.id, parsed.data.status, parsed.data),
    );

    return NextResponse.json({ data: guest }, { status: 201 });
  } catch (error) {
    if (error instanceof RsvpError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
