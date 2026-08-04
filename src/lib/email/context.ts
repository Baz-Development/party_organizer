import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type AdminClient = SupabaseClient<Database>;

export interface GuestEmailContext {
  guestId: string;
  email: string;
  name: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
}

/**
 * Resolve o que as rotas precisam para enfileirar um e-mail ligado a um
 * convidado (nome, e-mail, evento) a partir do `guestId` — usado depois de
 * `submitRsvp`/`submitOpenRsvp`, que devolvem `Guest` sem esses campos de
 * evento (o tipo `Guest` de `src/lib/types.ts` é contrato preservado, não
 * mexido por este change).
 *
 * `null` quando o convidado não tem e-mail cadastrado — quem chama decide
 * não enfileirar nesse caso.
 */
export async function resolveGuestEmailContext(
  admin: AdminClient,
  guestId: string,
): Promise<GuestEmailContext | null> {
  const { data } = await admin
    .from("guests")
    .select("id, name, email, event_id, events(slug, title)")
    .eq("id", guestId)
    .single();

  if (!data?.email || !data.events) return null;

  return {
    guestId: data.id,
    email: data.email,
    name: data.name,
    eventId: data.event_id,
    eventSlug: data.events.slug,
    eventTitle: data.events.title,
  };
}
