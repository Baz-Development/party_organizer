import { getMenuPollsForGuest } from "@/lib/db/menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadPublicEvent } from "../load-event";
import { MenuVote } from "./MenuVote";

export const metadata = { title: "Votação de cardápio — Convite" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ convite?: string }>;
}) {
  const { slug } = await params;
  const { convite } = await searchParams;
  const event = await loadPublicEvent(slug, "cardapio");

  const supabase = await createSupabaseServerClient();
  const polls = await getMenuPollsForGuest(supabase, slug);

  return <MenuVote event={event} polls={polls} token={convite ?? null} />;
}
