## 1. Migrations: schema

- [x] 1.1 Criar `supabase/migrations/<ts>_guests.sql` com a tabela `guests`,
      índices (`event_id`, `event_id, status`), índice único parcial de
      deduplicação e trigger `touch_updated_at`.
- [x] 1.2 Criar `supabase/migrations/<ts>_guest_invites.sql` com a tabela
      `guest_invites` (token via `encode(gen_random_bytes(32), 'hex')`).
- [x] 1.3 Criar `supabase/migrations/<ts>_rsvp_responses.sql` com a tabela de
      histórico append-only.
- [x] 1.4 Criar `supabase/migrations/<ts>_events_rsvp_settings.sql` com
      `alter table events add column rsvp_deadline`, `guest_list_open`.
- [x] 1.5 Rodar `supabase db reset` local e conferir que as quatro migrations
      aplicam sem erro.

## 2. Migrations: funções e RLS

- [x] 2.1 Criar `supabase/migrations/<ts>_guest_functions.sql` com
      `get_guest_by_invite_token`, `submit_rsvp`, `submit_open_rsvp` e os
      `grant execute` para `anon, authenticated`.
- [x] 2.2 Criar `supabase/migrations/<ts>_rls_guests.sql` habilitando RLS e
      criando as políticas `guests_manage`, `guest_invites_manage`,
      `rsvp_responses_read` em cima de `can_manage_event`.
- [x] 2.3 Testar manualmente via `supabase db reset` + SQL: convidado de um
      evento não aparece em consulta de outro; `anon` não lê `guests` nem
      `guest_invites` diretamente; `submit_rsvp` com token inválido levanta
      `convite_invalido`.
- [x] 2.4 Regenerar `src/lib/database.types.ts` (`supabase gen types
      typescript`) para incluir as tabelas e funções novas.

## 3. Camada de dados (`src/lib/db/guests.ts`)

- [x] 3.1 Definir `GuestRow` e o mapeador `toGuest` em
      `src/lib/db/mappers.ts`, convertendo para o tipo `Guest` existente em
      `src/lib/types.ts` (incluindo `unlisted`).
- [x] 3.2 Implementar `listGuests(client, eventId, { status? })` e
      `guestStats(client, eventId)` (ou calcular estatísticas em memória a
      partir de `listGuests`, decidir na implementação qual é mais barato).
- [x] 3.3 Implementar `createGuest`, `updateGuest`, `deleteGuest` usando o
      client autenticado (RLS de `guests_manage`), gerando também a linha em
      `guest_invites` na criação.
- [x] 3.4 Implementar `importGuests(client, eventId, rows)` com `insert ...
      on conflict` reaproveitando duplicata por `(event_id, name, email)`, e
      retorno linha a linha de aceito/rejeitado com motivo.
- [x] 3.5 Implementar `exportGuests(client, eventId)` retornando todos os
      campos exigidos pela spec de exportação.
- [x] 3.6 Implementar `getGuestByInviteToken(client, token)` e
      `submitRsvp(client, token, input)` chamando as RPCs via `client.rpc`
      com o client anônimo (sem sessão).
- [x] 3.7 Implementar `submitOpenRsvp(client, eventSlug, input)` chamando
      `submit_open_rsvp`.
- [x] 3.8 Mapear os `errcode = 'P0001'` (`convite_invalido`,
      `modulo_desabilitado`, `prazo_encerrado`, `lista_fechada`) para classes
      de erro de domínio em `src/lib/db/errors.ts`, seguindo o padrão de
      `DbError`/`SlugConflictError`.

## 4. Validação (`src/lib/validation/`)

- [x] 4.1 Criar `src/lib/validation/guest.ts` com schemas Zod para criação,
      edição e importação de convidado (nome obrigatório, contadores >= 0).
- [x] 4.2 Criar `src/lib/validation/rsvp.ts` com schema para o payload de
      `submit_rsvp` e `submit_open_rsvp`.
- [x] 4.3 Estender `src/lib/validation/event.ts` (ou criar schema dedicado)
      para `rsvp_deadline` e `guest_list_open` do `/painel/editor`.

## 5. Rotas de API

- [x] 5.1 Substituir `GET /api/eventos/[slug]/convidados` para consultar
      `listGuests`/`guestStats` de verdade, mantendo o filtro `?status=`.
- [x] 5.2 Substituir `POST /api/eventos/[slug]/convidados` para chamar
      `createGuest`, removendo `persisted: false`.
- [x] 5.3 Criar `PATCH/DELETE /api/eventos/[slug]/convidados/[id]` para
      edição e remoção.
- [x] 5.4 Criar `POST /api/eventos/[slug]/convidados/importar` para
      importação em lote.
- [x] 5.5 Criar `GET /api/eventos/[slug]/convidados/exportar` para
      exportação.
- [x] 5.6 Criar `GET /api/rsvp/[token]` chamando
      `getGuestByInviteToken` para prefill de `/e/[slug]/rsvp`.
- [x] 5.7 Criar `POST /api/rsvp/[token]` chamando `submitRsvp`.
- [x] 5.8 Criar `POST /api/eventos/[slug]/rsvp-aberto` chamando
      `submitOpenRsvp`, ativo só quando `guest_list_open` está ligado.
- [x] 5.9 Estender `PATCH /api/eventos/[slug]` (ou rota equivalente do
      editor) para gravar `rsvp_deadline` e `guest_list_open`.

## 6. Telas

- [x] 6.1 Ligar `src/app/e/[slug]/rsvp/RsvpFlow.tsx` às rotas novas: prefill
      pelo token na URL, submissão real, mensagens de prazo encerrado e
      lista fechada.
- [x] 6.2 Ligar `/painel/convidados` à lista e estatísticas reais, incluindo
      indicação visual de convidado "não listado".
- [x] 6.3 Adicionar import/export na tela de `/painel/convidados`.
- [x] 6.4 Adicionar os campos de prazo de RSVP e lista aberta em
      `src/app/painel/editor/EditorForm.tsx`.
- [x] 6.5 Atualizar a contagem de confirmados exibida em `/painel`.

## 7. Testes e limpeza

- [x] 7.1 Escrever testes de integração para os cenários das specs
      (`convidados` e `rsvp`): cadastro sem nome, convidado de outro evento,
      token de outro evento, prazo encerrado, lista aberta ligada/desligada,
      recusa zera acompanhantes/crianças, duplicata na importação.
- [x] 7.2 Remover `src/lib/fixtures/guests.ts` e qualquer referência restante
      a `GUESTS`/`guestStats` mockado.
- [x] 7.3 Rodar `openspec validate add-guests-rsvp-backend --strict` e o
      lint/typecheck do projeto antes de arquivar o change.
