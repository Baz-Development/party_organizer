import { loadPublicEvent } from "../load-event";
import { MenuVote } from "./MenuVote";

export const metadata = { title: "Votação de cardápio — Convite" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await loadPublicEvent(slug, "cardapio");

  return <MenuVote event={event} />;
}
