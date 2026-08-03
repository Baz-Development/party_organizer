import Link from "next/link";
import { PanelNav } from "@/components/PanelNav";
import { SairButton } from "@/components/SairButton";
import { requireSession } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import { themeVars } from "@/lib/themes";

const ITEMS = [
  { href: "/painel", label: "Visão geral" },
  { href: "/painel/convidados", label: "Convidados" },
  { href: "/painel/editor", label: "Editor da página" },
  { href: "/painel/moderacao", label: "Moderação" },
];

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await requireSession("/painel");

  // O tema e o link público seguem o evento em que a pessoa é anfitriã. Quem
  // ainda não criou nenhum vê o painel com o tema padrão e sem o link.
  const events = await listEvents(supabase, { hostProfileId: user.id });
  const event = events[0];

  return (
    <div
      style={themeVars(event?.themeKey ?? "terracota")}
      className="min-h-screen bg-paper-3"
    >
      <PanelNav
        brand="Convite"
        items={ITEMS}
        right={
          <div className="flex items-center gap-2">
            {event && (
              <Link
                href={`/e/${event.slug}`}
                className="rounded-lg border border-line-strong px-3.5 py-2 text-[13.5px] font-semibold text-ink no-underline hover:bg-paper-2"
              >
                Ver página pública
              </Link>
            )}
            <SairButton />
          </div>
        }
      />
      {children}
    </div>
  );
}
