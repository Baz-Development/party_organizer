import type { Theme, ThemeKey } from "./types";

export const THEMES: Record<ThemeKey, Theme> = {
  oliva: {
    key: "oliva",
    label: "Oliva",
    accent: "#4a4f3a",
    accentStrong: "#3a3e2d",
    accentSoft: "#9aa184",
  },
  terracota: {
    key: "terracota",
    label: "Terracota",
    accent: "#a45c40",
    accentStrong: "#8a4a32",
    accentSoft: "#c9a084",
  },
  marinho: {
    key: "marinho",
    label: "Marinho",
    accent: "#22304a",
    accentStrong: "#18233a",
    accentSoft: "#8496b3",
  },
  dourado: {
    key: "dourado",
    label: "Dourado",
    accent: "#a8925a",
    accentStrong: "#8d7844",
    accentSoft: "#d3c49b",
  },
};

export const THEME_LIST = Object.values(THEMES);

/**
 * Variáveis CSS para aplicar o tema do evento em qualquer subárvore,
 * sem precisar recompilar o Tailwind.
 */
export function themeVars(key: ThemeKey): React.CSSProperties {
  const t = THEMES[key] ?? THEMES.terracota;
  return {
    "--accent": t.accent,
    "--accent-strong": t.accentStrong,
    "--accent-soft": t.accentSoft,
  } as React.CSSProperties;
}
