import { notFound } from "next/navigation";
import { getEventById } from "@/lib/db/events";
import { listPhotos, resolveCoverUrl } from "@/lib/db/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventSummary, ModuleId } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Carrega o evento de uma rota pública (`/[id]/[slug]`).
 *
 * Chama `src/lib/db/` direto, sem `fetch` para a própria API: no App Router
 * isso seria um salto de rede a mais para buscar o dado que o servidor já
 * consegue ler.
 *
 * O slug da URL é decorativo — quem resolve a página é o id. Id malformado,
 * id inexistente, evento não publicado sem vínculo e módulo desabilitado
 * levam todos ao mesmo 404 — nenhum deles revela que o evento existe.
 */
export async function loadPublicEvent(
  id: string,
  requiredModule?: ModuleId,
): Promise<EventSummary> {
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const event = await getEventById(supabase, id);

  if (!event) notFound();
  if (requiredModule && !event.modules.includes(requiredModule)) notFound();

  const coverUrl = await resolveCoverUrl(supabase, event.coverPath);

  // Prévia da seção de galeria na página pública: até 6 fotos aprovadas mais
  // recentes. A galeria completa e paginada vive em /[id]/[slug]/galeria.
  const gallery = event.modules.includes("galeria")
    ? (await listPhotos(supabase, event.id, { limit: 6, status: "aprovada" })).items.map(
        (p) => ({ id: p.id, url: p.url, label: p.caption || `Foto de ${p.author}` }),
      )
    : [];

  // O token de auto-cadastro é dado de gestão — nunca vai para o navegador na
  // página pública. Quem tem o link já carrega o token na própria URL.
  return { ...event, selfSignupToken: null, gallery, coverUrl };
}
