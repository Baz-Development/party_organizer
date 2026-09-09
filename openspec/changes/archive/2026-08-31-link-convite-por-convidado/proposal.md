## Why

Hoje o único jeito de o convidado receber seu link identificado é por e-mail — e
o e-mail é `mockEmailProvider`, descartado fora de produção, então na prática
nada chega. Sem token na URL, `/{id}/{slug}/rsvp` mostra um campo de nome livre
que qualquer visitante preenche; a resposta ou é recusada (lista fechada) ou cria
um convidado `unlisted` duplicado que não casa com o que o anfitrião cadastrou.
Resultado: o anfitrião adiciona convidados no painel e não tem como convidá-los,
e as confirmações não batem com a lista.

O mecanismo certo já existe (`guest_invites.token` + `?convite=<token>`): falta
expô-lo onde o anfitrião possa copiar e mandar por WhatsApp, e tirar o nome livre
do caminho padrão.

## What Changes

- **Painel de convidados** (`/painel/convidados`, `GuestManager.tsx`): cada
  convidado passa a ter link de convite copiável e botão "Enviar pelo WhatsApp"
  (`https://wa.me/<telefone>?text=…`, ou compartilhamento sem número). Ao
  adicionar um convidado, o link aparece pronto na hora.
- **API da lista** (`GET /api/eventos/[slug]/convidados`): passa a devolver o
  link de convite absoluto de cada convidado (hoje o token não é exposto ao
  anfitrião).
- **E-mail vira canal opcional**: o disparo de convite por e-mail
  (`/api/eventos/[slug]/convidados/enviar-convites`) continua, mas deixa de ser
  o caminho implícito. Em desenvolvimento os e-mails passam a ser visíveis no
  Mailpit local em vez de descartados.
- **BREAKING** — **RSVP anônimo pela URL nua é removido**: sem `?convite=`, a
  página `/{id}/{slug}/rsvp` não mostra mais campo de nome livre; instrui a
  pessoa a pedir seu link ao anfitrião.
- **Auto-cadastro por link dedicado (opt-in)**: novo `events.self_signup_token`
  que o anfitrião gera/revoga no painel. O link `/{id}/{slug}/rsvp?lista=<token>`
  habilita o formulário de nome livre e cria o convidado. Substitui o
  acoplamento entre `events.guest_list_open` e a URL nua do evento.
- `/api/eventos/[slug]/rsvp-aberto` passa a exigir o token de auto-cadastro.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `rsvp`: o link com token por convidado é o caminho primário de identificação;
  o RSVP sem token pela URL nua deixa de ser aceito; o RSVP de convidado não
  listado passa a exigir um link de auto-cadastro específico do evento em vez de
  a flag `guest_list_open`.
- `convidados`: o sistema deve disponibilizar a quem administra o evento o link
  de convite de cada convidado para compartilhamento direto (copiar / WhatsApp),
  sem depender de envio de e-mail.
- `eventos`: substituição da configuração "lista aberta" por um token de
  auto-cadastro que o anfitrião pode gerar e revogar.

O convite por e-mail (`notificacoes-email`) não muda em nível de requisito — só
deixa de ser o caminho implícito e passa a ser visível no Mailpit local (ajuste
de configuração, coberto em tasks).

## Impact

- **Migrations**: `events.self_signup_token` (nullable, único); política RLS
  permitindo o anfitrião ler `guest_invites.token` dos convidados do seu evento;
  migração/depreciação de `events.guest_list_open`.
- **Rotas/telas**: `GuestManager.tsx`, `AddGuestSheet`, `RsvpFlow.tsx`,
  `src/app/[id]/[slug]/rsvp/page.tsx`, `GET/POST /api/eventos/[slug]/convidados`,
  `/api/eventos/[slug]/convidados/[id]`, `/api/eventos/[slug]/rsvp-aberto`,
  `src/lib/db/guests.ts`, `src/lib/db/events.ts`, `src/lib/types.ts`.
- **Config local**: `.env.example` / `.env` (`EMAIL_TEST_REDIRECT_ADDRESS` e
  provedor SMTP de dev apontando para o Mailpit), `supabase/config.toml`
  (`local_smtp` / `smtp_port`).
- **Sem impacto** em pagamentos, mídia, amigo-secreto, cardápio.
