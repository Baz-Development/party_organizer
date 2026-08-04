import { loadPublicEvent } from "../load-event";
import { SecretSantaSignup } from "./SecretSantaSignup";

export const metadata = { title: "Amigo secreto — Convite" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ convite?: string }>;
}) {
  const { slug } = await params;
  const { convite } = await searchParams;
  const event = await loadPublicEvent(slug, "amigo-secreto");

  return <SecretSantaSignup event={event} token={convite ?? null} />;
}
