import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Slug de um evento publicado, para o "ver exemplo ao vivo" da landing e para
 * o índice de rotas.
 *
 * Lido sem sessão, então a RLS já garante que só volta o que é público — a
 * landing nunca vai apontar para o rascunho de alguém.
 */
export async function getShowcaseSlug(
  client: SupabaseClient<Database>,
): Promise<string | null> {
  const { data } = await client
    .from("events")
    .select("slug")
    .eq("status", "publicado")
    .order("event_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.slug ?? null;
}
