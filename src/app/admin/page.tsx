import { requireAdmin } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import { toProfile } from "@/lib/db/mappers";
import { getEventsPerMonth, getGuestsThisMonth } from "@/lib/db/platform";
import { AdminPanel } from "./AdminPanel";

export const metadata = { title: "Admin — Convite" };

export default async function Page() {
  const { supabase } = await requireAdmin("/admin");

  // Admin enxerga a plataforma inteira — não por filtro aqui, mas porque as
  // políticas de RLS abrem tudo para `is_platform_admin()`.
  const [events, profiles, eventsPerMonth, guestsThisMonth] = await Promise.all([
    listEvents(supabase),
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    getEventsPerMonth(supabase),
    getGuestsThisMonth(supabase),
  ]);

  return (
    <AdminPanel
      events={events}
      profiles={(profiles.data ?? []).map(toProfile)}
      eventsPerMonth={eventsPerMonth}
      guestsThisMonth={guestsThisMonth}
    />
  );
}
