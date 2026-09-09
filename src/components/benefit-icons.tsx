import type { SVGProps } from "react";

/**
 * Ícones de traço da seção "Por que escolher a Convite". SVG inline, sem
 * dependência externa — usam `currentColor`, então herdam a cor de quem
 * renderiza (hoje, o dourado do accent).
 */

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

/** Confirmação rápida — cursor com "toque". */
export function TapIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 11V6a2 2 0 1 1 4 0v5" />
      <path d="M13 8a2 2 0 0 1 4 0v2" />
      <path d="M17 9.5a2 2 0 0 1 4 0V15a6 6 0 0 1-6 6h-2a7 7 0 0 1-6-3.5L4 14a2 2 0 0 1 3-2.5l2 2" />
    </svg>
  );
}

/** Lista de presentes sem duplicidade — presente com selo. */
export function GiftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8" />
      <path d="M3 8h18v4H3z" />
      <path d="M12 8v13" />
      <path d="M12 8S10.5 4 8.5 4A2.5 2.5 0 0 0 8.5 9M12 8s1.5-4 3.5-4a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

/** Amigo secreto — troca/sorteio. */
export function ShuffleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h3.5l9 10H20" />
      <path d="M17 4l3 3-3 3" />
      <path d="M4 17h3.5l2.5-2.8" />
      <path d="M14 9.8 16.5 7" />
      <path d="M17 14l3 3-3 3" />
    </svg>
  );
}

/** Recomendação de casas de eventos — selo de aprovação. */
export function SealIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l2.4 1.8 3-.2.6 2.9L20.5 12l-2 2.7.4 3-2.9.9L12 21l-3.9-1.5-2.9-.9.4-3-2-2.7 1.9-3.7.6-2.9 3 .2z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/** Editor sem código — pincel/varinha. */
export function BrushIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 4 20 9 9 20l-5 1 1-5z" />
      <path d="m13.5 6.5 4 4" />
      <path d="M5 16c1.5 0 2 1 2 2s-.5 2-3 2" />
    </svg>
  );
}

export const BENEFIT_ICONS = {
  tap: TapIcon,
  gift: GiftIcon,
  shuffle: ShuffleIcon,
  seal: SealIcon,
  brush: BrushIcon,
} as const;

export type BenefitIconKey = keyof typeof BENEFIT_ICONS;
