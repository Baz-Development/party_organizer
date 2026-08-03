import { loadPublicEvent } from "../load-event";
import { SecretSantaSignup } from "./SecretSantaSignup";

export const metadata = { title: "Amigo secreto — Convite" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await loadPublicEvent(slug, "amigo-secreto");

  return <SecretSantaSignup event={event} />;
}
