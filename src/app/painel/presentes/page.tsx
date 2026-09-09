import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import { GiftManager } from "./GiftManager";

export const metadata = { title: "Presentes — Convite" };

export default async function Page() {
  const { supabase, user } = await requireSession("/painel/presentes");

  const events = await listEvents(supabase, { hostProfileId: user.id });
  const event = events[0];

  // Sem evento não há catálogo de presentes para gerenciar.
  if (!event) redirect("/painel");

  return <GiftManager event={event} />;
}
