import { loadPublicEvent } from "../load-event";
import { SecretSantaSignup } from "./SecretSantaSignup";

export const metadata = { title: "Amigo secreto — Convite" };

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

  return <SecretSantaSignup event={event} token={convite ?? null} />;
}
