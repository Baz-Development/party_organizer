import { redirect } from "next/navigation";
import { LinkButton } from "@/components/ui";
import { requireSession } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import { themeVars } from "@/lib/themes";

export const metadata = { title: "Sua página de evento — Convite" };

/**
 * A criação de evento deixou de ser self-service: quem monta a página é a
 * Equipe ALF Eventos, que define a conta anfitriã no ato. Esta rota, que antes
 * era o formulário de onboarding, agora só informa o estado da conta.
 *
 * Quem já é anfitrião de algum evento é levado direto ao painel.
 */
export default async function OnboardingPage() {
  const { supabase, user } = await requireSession("/onboarding");

  const events = await listEvents(supabase, { hostProfileId: user.id });
  if (events.length > 0) redirect("/painel");

  return (
    <div style={themeVars({ themeKey: "dourado" })} className="min-h-screen bg-paper-3">
      <div className="mx-auto max-w-[560px] px-6 py-24 text-center">
        <div className="mb-6 text-[13px] uppercase tracking-[2px] text-accent">ALF Eventos</div>
        <h1 className="mb-4 font-display text-[clamp(24px,4vw,32px)] font-semibold">
          Sua página está sendo preparada
        </h1>
        <p className="mb-8 text-[16px] leading-relaxed text-ink-soft">
          A Equipe ALF Eventos monta a página do seu evento e vincula a sua conta
          como anfitriã. Assim que ela estiver pronta, você recebe o acesso e
          passa a cuidar do conteúdo, do cronograma e da moderação da galeria e
          do mural.
        </p>
        <LinkButton href="/painel" size="lg">
          Ir para o painel
        </LinkButton>
      </div>
    </div>
  );
}
