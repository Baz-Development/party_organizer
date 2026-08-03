import { loadPublicEvent } from "../../load-event";
import { SecretSantaReveal } from "./SecretSantaReveal";

export const metadata = { title: "Revelação do amigo secreto — Convite" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await loadPublicEvent(slug, "amigo-secreto");

  return <SecretSantaReveal event={event} />;
}
