import { LinkButton } from "@/components/ui";
import { requireSession } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import { publicEnv } from "@/lib/env.public";
import { PainelOverview } from "./PainelOverview";

export const metadata = { title: "Painel — Convite" };

export default async function PainelDoCliente() {
  const { supabase, user } = await requireSession("/painel");

  // Sem filtro por dono na aplicação: a RLS já entrega só o que é dele. O
  // `hostProfileId` aqui é para separar "eventos que eu criei" de eventos que
  // enxergo por pertencer a uma organização.
  const events = await listEvents(supabase, { hostProfileId: user.id });
  const event = events[0];

  if (!event) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-24 text-center">
        <h1 className="mb-3 font-display text-[28px] font-semibold">
          Você ainda não tem um evento
        </h1>
        <p className="mb-8 text-[16px] leading-relaxed text-ink-soft">
          Crie o seu em poucos passos: escolha o tipo de festa, ative os módulos
          e compartilhe o link.
        </p>
        <LinkButton href="/onboarding" size="lg">
          Criar meu evento
        </LinkButton>
      </div>
    );
  }

  return <PainelOverview event={event} siteUrl={publicEnv.NEXT_PUBLIC_SITE_URL} />;
}
