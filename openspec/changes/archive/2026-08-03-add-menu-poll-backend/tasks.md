## 1. Migrations — tabelas

- [x] 1.1 Criar `supabase/migrations/<ts>_menu_polls.sql`: tabela `menu_polls`
      (etapa, pergunta, `closes_at`, `max_choices`), índice por evento, check
      `max_choices >= 1`, check `closes_at >= created_at`, trigger
      `touch_updated_at`.
- [x] 1.2 Criar `supabase/migrations/<ts>_menu_options.sql`: tabela
      `menu_options` (nome, descrição, tags), índice por enquete.
- [x] 1.3 Criar `supabase/migrations/<ts>_menu_votes.sql`: tabela `menu_votes`
      (poll_id, guest_id, option_id), `unique (poll_id, guest_id, option_id)`,
      índices por enquete/opção/convidado.

## 2. Migrations — funções e RLS

- [x] 2.1 Criar `supabase/migrations/<ts>_menu_functions.sql`:
      `get_menu_polls_publicos(p_event_slug)`, `get_menu_votes_by_token(p_token)`,
      `submit_menu_vote(p_token, p_poll_id, p_option_ids)` (valida token,
      módulo `cardapio` habilitado, prazo, opções pertencentes à enquete,
      limite de escolhas; serializa com `pg_advisory_xact_lock`; apaga e
      reinsere o conjunto de votos do convidado).
- [x] 2.2 Grant `execute` das três funções para `anon`, `authenticated`.
- [x] 2.3 Criar `supabase/migrations/<ts>_rls_menu.sql`: habilitar RLS nas três
      tabelas; política de gestão (`for all`) para `authenticated` via
      `can_manage_event`; política de select pública (`anon`,
      `authenticated`) para `menu_polls`/`menu_options` via
      `is_event_public`; política de select para `authenticated` em
      `menu_votes` via `can_manage_event`; grants explícitos de tabela
      (`authenticated`, `service_role`).
- [x] 2.4 Rodar `npx --no-install supabase db reset` e `npm run db:types`.

## 3. Camada de dados e validação

- [x] 3.1 Criar `src/lib/validation/menu.ts`: schemas Zod de criação/edição de
      enquete (etapa, pergunta, prazo futuro, `maxChoices >= 1`, ao menos duas
      opções) e de opção (nome, descrição, tags), e de envio de voto
      (`pollId`, `optionIds` não vazio).
- [x] 3.2 Adicionar `MenuVoteError`/mapeamento de erro de domínio
      (`convite_invalido`, `enquete_invalida`, `modulo_desabilitado`,
      `prazo_encerrado`, `escolha_vazia`, `excesso_de_escolhas`,
      `opcao_duplicada`, `opcao_invalida`) em `src/lib/db/errors.ts`, seguindo
      o padrão de `RsvpError`/`toRsvpError`.
- [x] 3.3 Criar `src/lib/db/menu.ts`: `listMenuPolls` (curadoria autenticada,
      com opções aninhadas), `createMenuPoll`, `updateMenuPoll`,
      `deleteMenuPoll`, `createMenuOption`, `deleteMenuOption` (com
      confirmação de remoção de opção votada), `getMenuPollsForGuest` (rpc
      `get_menu_polls_publicos`, agrupando linhas em `MenuPoll[]`),
      `getMenuVotesByToken` (rpc `get_menu_votes_by_token`), `submitMenuVote`
      (rpc `submit_menu_vote`).
- [x] 3.4 Adicionar mapeamento `GuestRow`-like em `src/lib/db/mappers.ts` se
      necessário para as linhas de `menu_polls`/`menu_options`.

## 4. Rotas de API

- [x] 4.1 `src/app/api/eventos/[slug]/cardapio/route.ts`: `GET` (curadoria,
      lista enquetes do evento) e `POST` (cria enquete + opções).
- [x] 4.2 `src/app/api/eventos/[slug]/cardapio/[id]/route.ts`: `PATCH`
      (atualiza enquete) e `DELETE` (remove enquete).
- [x] 4.3 `src/app/api/eventos/[slug]/cardapio/[id]/opcoes/route.ts`: `POST`
      (adiciona opção à enquete existente).
- [x] 4.4 `src/app/api/eventos/[slug]/cardapio/opcoes/[optionId]/route.ts`:
      `DELETE` (remove opção; exige `?force=true` se já tiver voto).
- [x] 4.5 `src/app/api/cardapio/[token]/route.ts`: `GET` (enquetes públicas do
      evento do token + escolhas atuais do convidado) e `POST` (envia voto de
      uma enquete: `{ pollId, optionIds }`).

## 5. Front-end do convidado

- [x] 5.1 Atualizar `src/app/e/[slug]/cardapio/page.tsx` para ler `?convite=`
      da query string, igual a `rsvp/page.tsx`.
- [x] 5.2 Reescrever `src/app/e/[slug]/cardapio/MenuVote.tsx` para buscar
      enquetes e voto atual via `/api/cardapio/[token]` e enviar escolhas via
      `POST`, removendo o uso de `MENU_POLLS`.
- [x] 5.3 Remover `src/lib/fixtures/menu.ts` e qualquer import remanescente.

## 6. Testes

- [x] 6.1 Criar `tests/menu-poll.test.mjs` seguindo o estilo de
      `tests/rsvp.test.mjs`: cenário com convidado + `guest_invites` via
      `admin`, módulo `cardapio` habilitado.
- [x] 6.2 Cobrir: voto dentro do limite, excesso de escolhas, opção de outra
      enquete, token inválido/inexistente, troca de voto (contagem não
      duplica), prazo encerrado recusa voto e preserva o anterior, módulo
      desabilitado recusa voto, apuração pública não expõe `guest_id`,
      anfitrião lê `menu_votes` e quem não administra o evento não lê.
- [x] 6.3 Cobrir RLS em `tests/rls.test.mjs` ou no novo arquivo: `anon` não
      lê `menu_votes` diretamente; quem não administra o evento não
      cria/edita/remove enquete ou opção.

## 7. Fechamento

- [x] 7.1 Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run
      build` e corrigir o que falhar.
- [x] 7.2 Marcar todas as tarefas deste arquivo como concluídas.
- [x] 7.3 Rodar `npx openspec validate add-menu-poll-backend --strict` e
      corrigir até passar.
- [x] 7.4 Rodar `npx openspec archive add-menu-poll-backend -y`.
