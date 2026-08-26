import { loadPublicEvent } from "../load-event";
import { GalleryAndMural } from "./GalleryAndMural";

export const metadata = { title: "Galeria e mural — Convite" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await loadPublicEvent(id, "galeria");

  return <GalleryAndMural event={event} />;
}
