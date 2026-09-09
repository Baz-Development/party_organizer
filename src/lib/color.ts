/**
 * Utilidades de cor para a cor de destaque e o fundo personalizados do
 * editor. Tudo em hex `#rrggbb` — é o que `<input type="color">` produz e o
 * que o banco guarda.
 */

const HEX_RE = /^#([0-9a-f]{6})$/i;

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value);
}

function toRgb(hex: string): [number, number, number] {
  const match = HEX_RE.exec(hex);
  const clean = match ? match[1] : "000000";
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Texto legível (preto ou branco) para colocar em cima de `hex`, pela
 * fórmula de luminância perceptual (YIQ). Serve de sugestão inicial — o
 * editor deixa o anfitrião trocar manualmente.
 */
export function contrastText(hex: string): "#080808" | "#f5f3ee" {
  const [r, g, b] = toRgb(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? "#080808" : "#f5f3ee";
}

/** Clareia (`amount` > 0) ou escurece (`amount` < 0) `hex` em direção a branco/preto. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = toRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.min(1, Math.abs(amount) / 100);
  return toHex([r + (target - r) * t, g + (target - g) * t, b + (target - b) * t]);
}
