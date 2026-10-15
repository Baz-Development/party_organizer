import { InviteOpening } from "@/components/invite-opening/InviteOpening";
import { confettiFor, pickOpening, sanitizeGuestName } from "@/components/invite-opening/pick";
import { getEventById } from "@/lib/db/events";
import { longDate } from "@/lib/format";
import { themeVars } from "@/lib/themes";
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nome?: string | string[] }>;
}) {
  const { id } = await params;
  const { nome } = await searchParams;
  const event = await loadPublicEvent(id);

  return (
    <>
      {/* Sem JS não há gesto possível: a capa some e a página aparece direto. */}
      <noscript>
        <style>{"[data-invite-opening]{display:none!important}"}</style>
      </noscript>
      <InviteOpening
        inviteId={event.id}
        title={event.title}
        eyebrow={event.eyebrow}
        dateLabel={longDate(event.date)}
        coverUrl={event.coverUrl}
        opening={pickOpening(event.kind, event.id)}
        confetti={confettiFor(event.kind)}
        guestName={sanitizeGuestName(nome)}
        themeStyle={themeVars(event)}
      >
        <EventPage event={event} />
      </InviteOpening>
    </>
  );
}
