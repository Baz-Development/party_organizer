import { loadPublicEvent } from "../load-event";
import { GiftList } from "./GiftList";

export const metadata = { title: "Lista de presentes — Convite" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await loadPublicEvent(id, "presentes");

  return <GiftList event={event} />;
}
