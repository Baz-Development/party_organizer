import { publicEnv } from "@/lib/env.public";

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

/** URL absoluta do evento — para links que saem do site (WhatsApp, e-mail). */
export function absoluteEventUrl(event: { id: string; slug: string }, path = ""): string {
  return `${publicEnv.NEXT_PUBLIC_SITE_URL}${eventUrl(event, path)}`;
}

/**
 * Link de RSVP que identifica um convidado pelo token de convite. É o link que
 * o anfitrião compartilha por qualquer meio — não depende de e-mail.
 */
export function guestInviteUrl(event: { id: string; slug: string }, inviteToken: string): string {
  return `${absoluteEventUrl(event, "/rsvp")}?convite=${inviteToken}`;
}

/**
 * Link de auto-cadastro do evento: habilita o RSVP de quem não está na lista.
 * Só existe quando o anfitrião ativou o auto-cadastro.
 */
export function selfSignupUrl(event: { id: string; slug: string }, signupToken: string): string {
  return `${absoluteEventUrl(event, "/rsvp")}?lista=${signupToken}`;
}
