import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { getRecentActivity } from "@/lib/db/activity";
import { listEvents } from "@/lib/db/events";
import { getGiftsSummary } from "@/lib/db/gifts";
import { computeGuestStats, listGuests } from "@/lib/db/guests";
import { publicEnv } from "@/lib/env.public";
import { PainelOverview } from "./PainelOverview";

export const metadata = { title: "Painel — Convite" };

export default async function PainelDoCliente() {
  const { supabase, user, profile } = await requireSession("/painel");

  // O admin não é anfitrião de evento nenhum: sem isto, cairia no aviso de
  // "página sendo preparada" em vez do painel da plataforma.
  if (profile.role === "admin") redirect("/admin");

  // Sem filtro por dono na aplicação: a RLS já entrega só o que é dele. O
  // `hostProfileId` aqui restringe à lista de eventos em que a pessoa é
  // anfitriã (um admin veria todos sem ele).
  const events = await listEvents(supabase, { hostProfileId: user.id });
  const event = events[0];

  if (!event) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-24 text-center">
        <h1 className="mb-3 font-display text-[28px] font-semibold">
          Sua página está sendo preparada
        </h1>
        <p className="mb-8 text-[16px] leading-relaxed text-ink-soft">
          A Equipe Villa Glam monta a página do seu evento e vincula a sua
          conta como anfitriã. Assim que estiver pronta, ela aparece aqui e você
          passa a editar o conteúdo e moderar a galeria e o mural.
        </p>
      </div>
    );
  }

  const [guests, giftsSummary, activity] = await Promise.all([
    listGuests(supabase, event),
    getGiftsSummary(supabase, event.id),
    getRecentActivity(supabase, event.id),
  ]);
  const stats = computeGuestStats(guests);

  return (
    <PainelOverview
      event={event}
      siteUrl={publicEnv.NEXT_PUBLIC_SITE_URL}
      guestStats={stats}
      giftsSummary={giftsSummary}
      activity={activity}
    />
  );
}
