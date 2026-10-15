import { notFound } from "next/navigation";
import { loadPublicEvent } from "../load-event";
import { GalleryAndMural } from "./GalleryAndMural";

export const metadata = { title: "Galeria e mural — Convite" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await loadPublicEvent(id);

  // A página existe se o evento tem galeria ou mural (ou os dois).
  if (!event.modules.includes("galeria") && !event.modules.includes("mural")) notFound();

  return <GalleryAndMural event={event} />;
}
