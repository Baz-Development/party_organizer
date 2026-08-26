import { getEventById } from "@/lib/db/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EventPage } from "./EventPage";
import { loadPublicEvent } from "./load-event";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Metadata não pode dar 404, então lê direto em vez de usar o loader.
  const supabase = await createSupabaseServerClient();
  const event = await getEventById(supabase, id);

  return {
    title: event ? `${event.title} — Convite` : "Evento não encontrado",
    description: event?.welcome,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await loadPublicEvent(id);

  return <EventPage event={event} />;
}
