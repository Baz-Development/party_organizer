## 1. Migrations e RLS

- [x] 1.1 Migration: `alter table events add column self_signup_token text unique`, backfill dos eventos com `guest_list_open = true` (token aleatório), `drop column guest_list_open`
- [x] 1.2 Migration: função `submit_self_signup_rsvp(event_slug, signup_token, name, status, companions, kids, dietary)` `security definer`, `drop function submit_open_rsvp`, grants para `anon, authenticated`
- [x] 1.3 Teste RLS: anfitrião lê `guest_invites.token` dos seus convidados; usuário sem vínculo e `anon` não leem (`tests/rls.test.mjs`)
- [x] 1.4 Regenerar `src/lib/database.types.ts` com `supabase gen types`

## 2. Camada de dados e tipos

- [x] 2.1 `src/lib/types.ts`: trocar `guestListOpen: boolean` por `selfSignupToken: string | null` em `EventSummary`; adicionar `inviteUrl: string` em `Guest`
- [x] 2.2 `src/lib/db/mappers.ts`: mapear `self_signup_token`; montar `inviteUrl` do convidado a partir de `NEXT_PUBLIC_SITE_URL` + `eventUrl(event, "/rsvp")` + `?convite=<token>`
- [x] 2.3 `src/lib/db/guests.ts`: `listGuests` passa a fazer `select("*, guest_invites(token)")`; remover `submitOpenRsvp`, adicionar `submitSelfSignupRsvp(client, slug, signupToken, name, input)`
- [x] 2.4 `src/lib/db/events.ts`: ler `self_signup_token`; ações `activateSelfSignup(eventId)` / `revokeSelfSignup(eventId)`
- [x] 2.5 `src/lib/validation/event.ts`: remover `guestListOpen`; `src/lib/validation/rsvp.ts`: `submitOpenRsvpSchema` ganha `signupToken: z.string().min(1)`
- [x] 2.6 `src/lib/mock-data.ts` e `src/lib/fixtures/painel.ts`: remover `guestListOpen`, adicionar `selfSignupToken` e `inviteUrl`

## 3. Rotas de API

- [x] 3.1 `GET /api/eventos/[slug]/convidados`: incluir `inviteUrl` por convidado na resposta
- [x] 3.2 `/api/eventos/[slug]/rsvp-aberto`: validar `signupToken`, chamar `submitSelfSignupRsvp`; token inválido → 400 "lista_fechada"
- [x] 3.3 Nova rota `POST /api/eventos/[slug]/auto-cadastro` (ativar/revogar link), escopada pela RLS via `getEventBySlug`
- [x] 3.4 Editor: `/api/eventos/[slug]` (ou action do editor) deixa de aceitar `guestListOpen`

## 4. Fluxo público de RSVP

- [x] 4.1 `src/app/[id]/[slug]/rsvp/page.tsx`: ler `searchParams` `{ convite?, lista? }`, passar ambos ao `RsvpFlow`
- [x] 4.2 `RsvpFlow.tsx`: caminho `lista` (nome livre → POST com `signupToken`); sem `convite` nem `lista` → tela "peça seu link a quem organiza"; remover uso de `event.guestListOpen`
- [x] 4.3 `src/app/[id]/[slug]/load-event.ts` / `EventSummary`: parar de expor `guestListOpen`; expor apenas se o auto-cadastro está ativo quando `?lista=` bate

## 5. Painel de convidados

- [x] 5.1 `GuestManager.tsx` sheet de detalhe: campo do `inviteUrl` + botões "Copiar link", "Enviar pelo WhatsApp" (`wa.me/<phone>?text=` com fallback sem número), `navigator.share` no mobile
- [x] 5.2 `AddGuestSheet`: após criar, exibir o `inviteUrl` do convidado novo com os mesmos botões antes de fechar
- [x] 5.3 Ação de bulk "Copiar todos os links" para os convidados filtrados
- [x] 5.4 Card "Link de auto-cadastro" (ativar / revogar / copiar) na tela de convidados
- [x] 5.5 Renomear "Enviar convites pendentes" → "Enviar convites por e-mail" com texto de ajuda (canal opcional)

## 6. E-mail visível no Mailpit (dev)

- [x] 6.1 `supabase/config.toml`: descomentar `smtp_port = 54425` em `[local_smtp]`
- [x] 6.2 `src/lib/email/env.ts`: adicionar `EMAIL_SMTP_HOST`/`EMAIL_SMTP_PORT` opcionais
- [x] 6.3 `src/lib/email/smtpEmailProvider.ts` (import dinâmico de `nodemailer`, devDependency) e seleção condicional em `src/lib/email/index.ts`
- [x] 6.4 `.env.example` e `.env` local: `EMAIL_TEST_REDIRECT_ADDRESS`, `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`

## 7. Testes e verificação

- [x] 7.1 `tests/rsvp.test.mjs`: token de convidado responde; sem token nem `signupToken` recusa; `signupToken` válido cria `unlisted`; `signupToken` revogado recusa; após prazo recusa
- [x] 7.2 Teste do `GET convidados` devolvendo `inviteUrl` só para quem administra
- [x] 7.3 `npm run lint` + `npm test` + `tsc --noEmit` limpos
- [ ] 7.4 Verificação manual: adicionar convidado → copiar link → abrir em aba anônima → confirmar → aparece em `/painel/convidados`; e-mail de convite visível no Mailpit
- [x] 7.5 Atualizar `docs/alinhamento-villa-glam.md` se mencionar lista aberta
