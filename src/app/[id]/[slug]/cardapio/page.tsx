import { getMenuPollsForGuest } from "@/lib/db/menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadPublicEvent } from "../load-event";
import { MenuVote } from "./MenuVote";

export const metadata = { title: "Votação de cardápio — Convite" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ convite?: string }>;
}) {
  const { id } = await params;
  const { convite } = await searchParams;
  const event = await loadPublicEvent(id, "cardapio");

  const supabase = await createSupabaseServerClient();
  const polls = await getMenuPollsForGuest(supabase, event.slug);

  return <MenuVote event={event} polls={polls} token={convite ?? null} />;
}
