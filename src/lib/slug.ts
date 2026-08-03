/** Slug de reserva quando o título não sobra nenhum caractere utilizável. */
const FALLBACK = "evento";

/** Limite generoso: o slug é a URL pública, não um identificador interno. */
const MAX_LENGTH = 60;

/**
 * Deriva o slug público a partir do título: minúsculas, sem acentos, palavras
 * separadas por hífen.
 *
 * `normalize("NFD")` separa a letra do acento, e o intervalo `̀-ͯ`
 * remove os acentos soltos — é o que transforma "Convenção" em "convencao" sem
 * uma tabela de substituição.
 */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, "");

  return slug || FALLBACK;
}

/**
 * Resolve colisão acrescentando sufixo numérico: `marina-e-thiago`,
 * `marina-e-thiago-2`, `marina-e-thiago-3`…
 *
 * Vale só para slug **gerado**. Slug informado explicitamente que colide é
 * recusado com erro de conflito, porque silenciosamente entregar outro
 * endereço ao usuário seria pior do que dizer que o escolhido não está livre.
 */
export function resolveSlugCollision(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }

  // Mil homônimos é sinal de outra coisa acontecendo; não insistimos.
  throw new Error(`Não foi possível gerar um slug único a partir de "${base}"`);
}
