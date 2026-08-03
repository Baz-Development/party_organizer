import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/db/events";
import { galleryFor } from "@/lib/fixtures/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventSummary, ModuleId } from "@/lib/types";

/**
 * Carrega o evento de uma rota pública.
 *
 * Chama `src/lib/db/` direto, sem `fetch` para a própria API: no App Router
 * isso seria um salto de rede a mais para buscar o dado que o servidor já
 * consegue ler.
 *
 * Slug inexistente, evento não publicado sem vínculo e módulo desabilitado
 * levam todos ao mesmo 404 — nenhum deles revela que o evento existe.
 */
export async function loadPublicEvent(
  slug: string,
  requiredModule?: ModuleId,
): Promise<EventSummary> {
  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);

  if (!event) notFound();
  if (requiredModule && !event.modules.includes(requiredModule)) notFound();

  // A galeria ainda não tem tabela; composta aqui a partir da fixture até o
  // change `add-media-backend`.
  return { ...event, gallery: galleryFor(event.slug) };
}
