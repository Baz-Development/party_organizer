import { loadPublicEvent } from "../../load-event";
import { SecretSantaReveal } from "./SecretSantaReveal";

export const metadata = { title: "Revelação do amigo secreto — Convite" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ convite?: string }>;
}) {
  const { id } = await params;
  const { convite } = await searchParams;
  const event = await loadPublicEvent(id, "amigo-secreto");

  return <SecretSantaReveal event={event} token={convite ?? null} />;
}
