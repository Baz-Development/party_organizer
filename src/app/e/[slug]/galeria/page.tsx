import { loadPublicEvent } from "../load-event";
import { GalleryAndMural } from "./GalleryAndMural";

export const metadata = { title: "Galeria e mural — Convite" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await loadPublicEvent(slug, "galeria");

  return <GalleryAndMural event={event} />;
}
