import { loadPublicEvent } from "../load-event";
import { RsvpFlow } from "./RsvpFlow";

export const metadata = { title: "Confirmar presença — Convite" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ convite?: string }>;
}) {
  const { id } = await params;
  const { convite } = await searchParams;
  const event = await loadPublicEvent(id, "rsvp");

  return <RsvpFlow event={event} token={convite ?? null} />;
}
