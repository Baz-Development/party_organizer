import { loadPublicEvent } from "../load-event";
import { GiftList } from "./GiftList";

export const metadata = { title: "Lista de presentes — Convite" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await loadPublicEvent(slug, "presentes");

  return <GiftList event={event} />;
}
