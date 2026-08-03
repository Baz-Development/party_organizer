## Why

O RSVP é o motivo pelo qual o anfitrião contrata o produto: saber quem vem. Hoje
`/e/[slug]/rsvp` percorre os três passos e não grava nada, e
`/painel/convidados` mostra uma lista fixa de mocks. Sem persistência de convidados
não há lista, não há contagem e não há como enviar convite.

## What Changes

- Cria a lista de convidados por evento, com grupo, contato, acompanhantes, crianças
  e restrição alimentar.
- Cria o token de convite: um link por convidado que o identifica em `/e/[slug]` sem
  exigir conta, conforme o padrão fixado na fundação.
- Persiste o fluxo de RSVP de `/e/[slug]/rsvp` em três passos, aceitando confirmação
  e recusa, e permitindo que o convidado corrija a resposta até o prazo.
- Permite RSVP de convidado não listado, quando o anfitrião habilita lista aberta.
- Substitui os mocks de `GET` e `POST /api/eventos/[slug]/convidados` por
  persistência real, incluindo as estatísticas hoje calculadas por `guestStats`.
- Adiciona importação de convidados em lote e exportação da lista.
- **BREAKING**: `POST /api/eventos/[slug]/convidados` deixa de responder
  `persisted: false` e passa a gravar.

## Capabilities

### New Capabilities

- `convidados`: cadastro, agrupamento, edição, importação em lote, exportação e
  estatísticas da lista de convidados de um evento.
- `rsvp`: tokens de convite, respostas de confirmação e recusa, acompanhantes,
  restrições alimentares, prazo e correção de resposta.

### Modified Capabilities

- `eventos`: passa a expor prazo de RSVP e a opção de lista aberta como configuração
  do evento.

## Impact

- **Depende de**: `add-supabase-foundation` (RLS, `can_manage_event`,
  `is_event_public`, camada `src/lib/db/`).
- **Novas tabelas**: `guests`, `guest_invites`, `rsvp_responses`.
- **Rotas afetadas**: `GET/POST /api/eventos/[slug]/convidados`; novas rotas de
  RSVP por token, importação e exportação.
- **Telas afetadas**: `/e/[slug]/rsvp`, `/painel/convidados`, `/painel` (contagem de
  confirmados), `/painel/editor` (prazo e lista aberta).
- **Consumido por**: `add-transactional-emails` (envio de convites e confirmações) e
  `add-secret-santa-backend` (participantes derivados da lista).
