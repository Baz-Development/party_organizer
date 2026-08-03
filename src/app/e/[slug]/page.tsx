import { getEventBySlug } from "@/lib/db/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EventPage } from "./EventPage";
import { loadPublicEvent } from "./load-event";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Metadata não pode dar 404, então lê direto em vez de usar o loader.
  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);

  return {
    title: event ? `${event.title} — Convite` : "Evento não encontrado",
    description: event?.welcome,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await loadPublicEvent(slug);

  return <EventPage event={event} />;
}
