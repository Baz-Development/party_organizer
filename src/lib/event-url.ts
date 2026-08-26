/**
 * Monta o link público de um evento: `/{id}/{slug}[caminho]`.
 *
 * O id é o que identifica a página — imprevisível e sem risco de colisão. O
 * slug é só cosmético, para o link ficar legível; trocar o evento errado ali
 * não muda para qual evento a página aponta.
 */
export function eventUrl(event: { id: string; slug: string }, path = ""): string {
  return `/${event.id}/${event.slug}${path}`;
}
