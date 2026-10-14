/**
 * Feature toggles das seções da landing page.
 *
 * Cada seção tem um valor padrão aqui; a variável de ambiente
 * `NEXT_PUBLIC_LANDING_<SECAO>` (`true`/`false`, `1`/`0`, `on`/`off`) tem
 * prioridade quando definida. Variável ausente ou com valor irreconhecível
 * cai no padrão.
 *
 * Importável de Client Components. Os acessos a `process.env` precisam ser
 * literais: o Next.js só substitui `process.env.NEXT_PUBLIC_X` no bundle
 * quando o nome aparece por extenso.
 */
export const LANDING_DEFAULTS = {
  /** Contador de festas + faixa de parceiros. */
  proof: true,
  /** "Como funciona" (3 passos). */
  howItWorks: true,
  /** "Tipos de festa" (carrossel de mockups). */
  eventTypes: true,
  /** "Por que escolher a Convite". */
  benefits: true,
  /** Depoimentos. */
  testimonials: true,
  /** Planos e preços. */
  plans: true,
  /** Perguntas frequentes. */
  faq: true,
  /** CTA final (fundo escuro). */
  finalCta: true,
} as const;

export type LandingSection = keyof typeof LANDING_DEFAULTS;

function parseFlag(raw: string | undefined, fallback: boolean): boolean {
  switch (raw?.trim().toLowerCase()) {
    case "true":
    case "1":
    case "on":
      return true;
    case "false":
    case "0":
    case "off":
      return false;
    default:
      return fallback;
  }
}

export const landingFeatures: Record<LandingSection, boolean> = {
  proof: parseFlag(process.env.NEXT_PUBLIC_LANDING_PROOF, LANDING_DEFAULTS.proof),
  howItWorks: parseFlag(process.env.NEXT_PUBLIC_LANDING_HOW_IT_WORKS, LANDING_DEFAULTS.howItWorks),
  eventTypes: parseFlag(process.env.NEXT_PUBLIC_LANDING_EVENT_TYPES, LANDING_DEFAULTS.eventTypes),
  benefits: parseFlag(process.env.NEXT_PUBLIC_LANDING_BENEFITS, LANDING_DEFAULTS.benefits),
  testimonials: parseFlag(process.env.NEXT_PUBLIC_LANDING_TESTIMONIALS, LANDING_DEFAULTS.testimonials),
  plans: parseFlag(process.env.NEXT_PUBLIC_LANDING_PLANS, LANDING_DEFAULTS.plans),
  faq: parseFlag(process.env.NEXT_PUBLIC_LANDING_FAQ, LANDING_DEFAULTS.faq),
  finalCta: parseFlag(process.env.NEXT_PUBLIC_LANDING_FINAL_CTA, LANDING_DEFAULTS.finalCta),
};
