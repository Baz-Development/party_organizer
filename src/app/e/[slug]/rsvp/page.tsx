import { loadPublicEvent } from "../load-event";
import { RsvpFlow } from "./RsvpFlow";

export const metadata = { title: "Confirmar presença — Convite" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await loadPublicEvent(slug, "rsvp");

  return <RsvpFlow event={event} />;
}
