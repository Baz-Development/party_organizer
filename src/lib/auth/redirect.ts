/** Destino padrão de quem entra sem ter pedido uma rota específica. */
export const DEFAULT_NEXT = "/painel";

/**
 * Reduz um `next` recebido pela URL a um caminho relativo do próprio site.
 *
 * O parâmetro chega de fora — de um link mágico que qualquer um pode montar.
 * Sem esta redução, `/entrar?next=https://site-falso/` transformaria a tela de
 * login num open redirect: a pessoa autentica de verdade e é despejada em
 * outro domínio, já confiando na página.
 *
 * Aceita apenas o que começa com uma única barra. `//outro-host` e `/\outro`
 * são descartados porque navegadores os tratam como URL absoluta.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_NEXT,
): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;

  try {
    const base = "http://caminho-relativo.invalid";
    const url = new URL(value, base);
    // Uma URL absoluta disfarçada teria trocado a origem.
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** Monta o destino de login preservando a rota que a pessoa tentou abrir. */
export function loginPathFor(pathname: string): string {
  return `/entrar?next=${encodeURIComponent(safeNextPath(pathname))}`;
}
