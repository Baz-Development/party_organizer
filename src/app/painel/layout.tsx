import Link from "next/link";
import { PanelNav } from "@/components/PanelNav";
import { SairButton } from "@/components/SairButton";
import { requireSession } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import { eventUrl } from "@/lib/event-url";
import { themeVars } from "@/lib/themes";
import type { ModuleId } from "@/lib/types";


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

  // O menu segue os módulos do evento; sem evento, mostra tudo (o painel de
  // quem ainda não criou nada).
  const has = (m: ModuleId) => !event || event.modules.includes(m);
  const items = [
    { href: "/painel", label: "Visão geral" },
    { href: "/painel/convidados", label: "Convidados" },
    ...(has("presentes") ? [{ href: "/painel/presentes", label: "Presentes" }] : []),
    { href: "/painel/editor", label: "Editor da página" },
    ...(has("galeria") || has("mural")
      ? [{ href: "/painel/moderacao", label: "Moderação" }]
      : []),
  ];

  return (
    <div
      style={themeVars(event ?? { themeKey: "dourado" })}
      className="min-h-screen bg-paper-3"
    >
      <PanelNav
        brand="Painel"
        items={items}
        right={
          <div className="flex items-center gap-2">
            {event && (
              <Link
                href={eventUrl(event)}
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
