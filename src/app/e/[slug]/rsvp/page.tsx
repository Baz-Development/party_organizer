import { loadPublicEvent } from "../load-event";
import { RsvpFlow } from "./RsvpFlow";

export const metadata = { title: "Confirmar presença — Convite" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ convite?: string }>;
}) {
  const { slug } = await params;
  const { convite } = await searchParams;
  const event = await loadPublicEvent(slug, "rsvp");

  return <RsvpFlow event={event} token={convite ?? null} />;
}
