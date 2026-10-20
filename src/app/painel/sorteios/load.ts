import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import type { EventSummary } from "@/lib/types";

/**
 * Evento da anfitriã para as telas de sorteio. Sem evento, ou com o módulo
 * desligado, volta para a visão geral — igual a `/painel/presentes`.
 */
export async function loadRaffleHostEvent(pathname: string): Promise<EventSummary> {
  const { supabase, user } = await requireSession(pathname);

  const events = await listEvents(supabase, { hostProfileId: user.id });
  const event = events[0];

  if (!event || !event.modules.includes("sorteios")) redirect("/painel");

  return event;
}
