import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export interface ShowcaseEvent {
  id: string;
  slug: string;
}

/**
 * Id e slug de um evento publicado, para o "ver exemplo ao vivo" da landing
 * e para o índice de rotas.
 *
 * Lido sem sessão, então a RLS já garante que só volta o que é público — a
 * landing nunca vai apontar para o rascunho de alguém.
 */
export async function getShowcaseEvent(
  client: SupabaseClient<Database>,
): Promise<ShowcaseEvent | null> {
  const { data } = await client
    .from("events")
    .select("id, slug")
    .eq("status", "publicado")
    .order("event_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}
