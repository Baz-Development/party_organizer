import { requireSession } from "@/lib/auth/guards";
import { themeVars } from "@/lib/themes";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata = { title: "Criar meu evento — Convite" };

/**
 * Criar evento exige sessão: o anfitrião é o usuário autenticado. Sem sessão,
 * o guarda leva ao login e traz de volta para cá depois.
 */
export default async function OnboardingPage() {
  await requireSession("/onboarding");

  return (
    <div style={themeVars("terracota")}>
      <OnboardingFlow />
    </div>
  );
}
