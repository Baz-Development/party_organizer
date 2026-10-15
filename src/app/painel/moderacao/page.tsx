import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import { ModerationQueue } from "./ModerationQueue";

export const metadata = { title: "Moderação — Convite" };

export default async function Page() {
  const { supabase, user } = await requireSession("/painel/moderacao");

  const events = await listEvents(supabase, { hostProfileId: user.id });
  const event = events[0];

  if (!event || (!event.modules.includes("galeria") && !event.modules.includes("mural"))) {
    redirect("/painel");
  }

  return <ModerationQueue event={event} />;
}
