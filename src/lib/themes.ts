import { contrastText, shade } from "./color";
import type { EventSummary, Theme, ThemeKey } from "./types";

export const THEMES: Record<ThemeKey, Theme> = {
  oliva: {
    key: "oliva",
    label: "Oliva",
    accent: "#4a4f3a",
    accentStrong: "#3a3e2d",
    accentSoft: "#9aa184",
    onAccent: "#f5f3ee",
  },
  terracota: {
    key: "terracota",
    label: "Terracota",
    accent: "#a45c40",
    accentStrong: "#8a4a32",
    accentSoft: "#c9a084",
    onAccent: "#f5f3ee",
  },
  marinho: {
    key: "marinho",
    label: "Marinho",
    accent: "#22304a",
    accentStrong: "#18233a",
    accentSoft: "#8496b3",
    onAccent: "#f5f3ee",
  },
  dourado: {
    key: "dourado",
    label: "Dourado",
    accent: "#d4a72c",
    accentStrong: "#b58e1f",
    accentSoft: "#e6c875",
    onAccent: "#080808",
  },
};

export const THEME_LIST = Object.values(THEMES);

/**
 * Fundos prontos para a tela (atrás do cartão de conteúdo, que continua
 * sempre no off-white de `--paper`). Só tons claros — o texto do site
 * (`--ink`) é fixo em preto e não acompanha o fundo.
 */
export const BACKGROUND_PRESETS = [
  { label: "Off-white (padrão)", value: "#f0eee7" },
  { label: "Branco", value: "#ffffff" },
  { label: "Creme", value: "#f7f1e3" },
  { label: "Cinza claro", value: "#e9e5dc" },
] as const;

/**
 * Variáveis CSS para aplicar o tema do evento em qualquer subárvore, sem
 * precisar recompilar o Tailwind. `accentColor`/`accentTextColor` (cor
 * personalizada, fora dos 4 presets) sobrescrevem o tema quando presentes;
 * `backgroundColor` sobrescreve só o fundo da tela, atrás do cartão.
 */
export function themeVars(
  event: Pick<EventSummary, "themeKey" | "accentColor" | "accentTextColor" | "backgroundColor">,
): React.CSSProperties {
  const preset = THEMES[event.themeKey] ?? THEMES.dourado;
  const accent = event.accentColor || preset.accent;
  const custom = Boolean(event.accentColor);

  const vars: Record<string, string> = {
    "--accent": accent,
    "--accent-strong": custom ? shade(accent, -12) : preset.accentStrong,
    "--accent-soft": custom ? shade(accent, 22) : preset.accentSoft,
    "--on-accent": custom ? event.accentTextColor || contrastText(accent) : preset.onAccent,
  };

  if (event.backgroundColor) vars["--paper-3"] = event.backgroundColor;

  return vars as React.CSSProperties;
}
