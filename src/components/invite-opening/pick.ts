/**
 * Regras puras da abertura do convite: qual abertura, qual confete, texto da
 * capa e nome do convidado. Sem React nem DOM, para testar direto no Node.
 */

export type OpeningId = "envelope" | "balloon" | "candles" | "gift" | "scratch";

export type ConfettiStyle = "festivo" | "rose-dourado" | "petalas" | "discreto";

/** `EventKind` espelhado aqui para o módulo não depender de `@/lib/types`. */
type Kind =
  | "casamento"
  | "debutante"
  | "corporativo"
  | "aniversario"
  | "formatura"
  | "confraternizacao"
  | "outros";

const PLAYFUL: OpeningId[] = ["balloon", "candles", "gift", "scratch"];

/** Hash estável (não criptográfico) para a mesma festa sempre cair na mesma abertura. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Elegantes (casamento, 15 anos, corporativo...) usam o envelope. Aniversário
 * é lúdico: a abertura é sorteada de forma estável pelo id do convite, para
 * cada festa ter a sua e o link não mudar entre visitas.
 */
export function pickOpening(kind: Kind, id: string): OpeningId {
  if (kind === "aniversario") return PLAYFUL[hash(id) % PLAYFUL.length];
  return "envelope";
}

export function confettiFor(kind: Kind): ConfettiStyle {
  switch (kind) {
    case "aniversario":
      return "festivo";
    case "debutante":
      return "rose-dourado";
    case "casamento":
      return "petalas";
    default:
      return "discreto";
  }
}

/** Idade citada no título ("Bento faz 5 anos" → 5). `null` se não houver. */
export function parseAge(title: string): number | null {
  const m = title.match(/\b(\d{1,3})\s*(?:anos?|aninhos?)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n > 0 ? n : null;
}

/** Nome vindo de `?nome=`: sem controle/markup, espaços colapsados, até 40 caracteres. */
export function sanitizeGuestName(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const clean = value
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40)
    .trim();
  return clean || null;
}

export function coverLine(guestName: string | null): string {
  return guestName ? `${guestName}, você foi convidado(a)` : "Você foi convidado(a)";
}

export function storageKey(inviteId: string): string {
  return `convite-aberto:${inviteId}`;
}
