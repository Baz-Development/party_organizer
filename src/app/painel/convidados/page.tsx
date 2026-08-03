import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import { GuestManager } from "./GuestManager";

export const metadata = { title: "Convidados — Convite" };

export default async function Page() {
  const { supabase, user } = await requireSession("/painel/convidados");

  const events = await listEvents(supabase, { hostProfileId: user.id });
  const event = events[0];

  // Sem evento não há lista de convidados para gerenciar.
  if (!event) redirect("/painel");

  return <GuestManager event={event} />;
}
