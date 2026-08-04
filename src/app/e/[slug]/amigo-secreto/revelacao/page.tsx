import { loadPublicEvent } from "../../load-event";
import { SecretSantaReveal } from "./SecretSantaReveal";

export const metadata = { title: "Revelação do amigo secreto — Convite" };

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

  return <SecretSantaReveal event={event} token={convite ?? null} />;
}
