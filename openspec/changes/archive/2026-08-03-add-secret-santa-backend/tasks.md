## 1. Migrations — schema

- [x] 1.1 `supabase/migrations/..._secret_santa_participants.sql`: tabela
      `secret_santa_participants` (`event_id`, `guest_id` referenciando
      `guests`, `display_name`, `wishlist text[]`, `joined_at`), unique
      `(event_id, guest_id)`, índice por `event_id`, trigger
      `touch_updated_at`.
- [x] 1.2 `supabase/migrations/..._secret_santa_exclusions.sql`: tabela
      `secret_santa_exclusions` (`event_id`, `participant_a_id`,
      `participant_b_id`, ambos referenciando `secret_santa_participants`),
      `check` impedindo `participant_a_id = participant_b_id`, unique no par
      não ordenado (via `least`/`greatest` em coluna gerada ou índice de
      expressão).
- [x] 1.3 `supabase/migrations/..._secret_santa_draws.sql`: tabela
      `secret_santa_draws` (`event_id` unique, `executed_at`,
      `executed_by` referenciando `auth.users`).
- [x] 1.4 `supabase/migrations/..._secret_santa_assignments.sql`: tabela
      `secret_santa_assignments` (`draw_id` referenciando
      `secret_santa_draws` on delete cascade, `giver_participant_id`,
      `receiver_participant_id`), unique `(draw_id, giver_participant_id)` e
      `(draw_id, receiver_participant_id)`, `check` proibindo
      `giver_participant_id = receiver_participant_id`.
- [x] 1.5 `supabase/migrations/..._secret_santa_reveals.sql`: tabela
      `secret_santa_reveals` (`assignment_id` unique referenciando
      `secret_santa_assignments` on delete cascade, `revealed_at`).
- [x] 1.6 Rodar `npx --no-install supabase db reset` e `npm run db:types`;
      conferir que `src/lib/database.types.ts` ganhou as 5 tabelas novas.

## 2. Migrations — funções de adesão e wishlist

- [x] 2.1 `supabase/migrations/..._secret_santa_join_functions.sql`:
      `join_secret_santa(p_token text, p_display_name text)` — identifica o
      convidado pelo token via `guest_invites`, valida módulo habilitado,
      sorteio ainda não realizado e `display_name` não duplicado
      (case-insensitive) no evento, insere o participante.
- [x] 2.2 Mesma migration: `update_secret_santa_wishlist(p_token text,
      p_wishlist text[])` — atualiza a wishlist do participante identificado
      pelo token, recusa depois da revelação (não é requisito explícito do
      spec, mas evita editar lista já vista por quem tirou — se o spec não
      cobrir, liberar edição até o sorteio e deixar após o sorteio também
      liberado, seguindo à risca só o que está escrito).
- [x] 2.3 Mesma migration: `get_my_secret_santa_participation(p_token text)`
      — devolve dados do próprio participante (nome de exibição, wishlist,
      se já entrou) para prefill da tela de cadastro.
- [x] 2.4 Grant `execute` das três funções a `anon, authenticated`.
- [x] 2.5 Rodar `npx --no-install supabase db reset` e `npm run db:types`.

## 3. Migrations — restrições de par (gestão do anfitrião)

- [x] 3.1 `supabase/migrations/..._secret_santa_exclusion_functions.sql`:
      `add_secret_santa_exclusion(p_event_id uuid, p_participant_a uuid,
      p_participant_b uuid)` e `remove_secret_santa_exclusion(p_exclusion_id
      uuid)`, ambas exigindo `can_manage_event`.
- [x] 3.2 Grant `execute` a `authenticated`.

## 4. Migrations — sorteio

- [x] 4.1 `supabase/migrations/..._secret_santa_draw_function.sql`:
      `run_secret_santa_draw(p_event_id uuid)` — `security definer`,
      `pg_advisory_xact_lock(hashtext(p_event_id::text))`, valida módulo
      habilitado, nenhum sorteio prévio e mínimo de 3 participantes; gera
      derangement respeitando `secret_santa_exclusions` por tentativas
      aleatórias com limite, cai para busca com retrocesso se necessário;
      grava `secret_santa_draws` + `secret_santa_assignments` na mesma
      transação; levanta `sorteio_impossivel` sem gravar nada se não houver
      solução. Exige `can_manage_event`.
- [x] 4.2 Mesma migration: `redo_secret_santa_draw(p_event_id uuid)` —
      recusa se existir qualquer linha em `secret_santa_reveals` para o
      sorteio atual; caso contrário apaga o `secret_santa_draws` atual
      (cascade) e chama `run_secret_santa_draw` de novo, na mesma transação.
      Exige `can_manage_event`.
- [x] 4.3 Grant `execute` das duas a `authenticated`.
- [x] 4.4 Rodar `npx --no-install supabase db reset` e `npm run db:types`.

## 5. Migrations — revelação e status

- [x] 5.1 `supabase/migrations/..._secret_santa_reveal_functions.sql`:
      `get_my_secret_santa(p_token text)` — identifica participante pelo
      token, se não houver sorteio devolve estado "não sorteado"; se houver,
      resolve o `assignment` do participante como `giver`, faz upsert em
      `secret_santa_reveals` (primeira leitura grava `revealed_at`, leituras
      seguintes não sobrescrevem) e devolve nome + wishlist de quem foi
      tirado. Mensagens de erro sem nomes nem ids de participante.
- [x] 5.2 Mesma migration: `get_secret_santa_status(p_event_id uuid)` — exige
      `can_manage_event`, devolve só `participant_count` e `drawn_at`
      (nullable), nunca um par.
- [x] 5.3 Grant `execute` de `get_my_secret_santa` a `anon, authenticated`; de
      `get_secret_santa_status` a `authenticated`.
- [x] 5.4 Rodar `npx --no-install supabase db reset` e `npm run db:types`.

## 6. Migrations — RLS e grants

- [x] 6.1 `supabase/migrations/..._rls_secret_santa.sql`: `enable row level
      security` nas 5 tabelas.
- [x] 6.2 Política de `secret_santa_participants`: select para
      `can_manage_event` limitado a `id, display_name, joined_at` — **sem**
      expor `wishlist` por essa policy (wishlist só sai pela função de
      revelação, para quem tirou aquela pessoa). Se RLS de coluna não for
      viável de forma simples, mover `wishlist` para tabela própria só
      alcançável por função, e documentar a decisão como ajuste ao design.
- [x] 6.3 Nenhuma política de `select` para `secret_santa_assignments` nem
      `secret_santa_reveals` — confirmar que só `service_role` os alcança.
- [x] 6.4 `secret_santa_exclusions`: select/insert/delete só para
      `can_manage_event`.
- [x] 6.5 `grant all ... to service_role` nas 5 tabelas (a migration de
      fundação não alcança tabela criada depois).
- [x] 6.6 Rodar `npx --no-install supabase db reset` de novo e confirmar que
      `20260803121000_assert_rls_enabled.sql` não falha.

## 7. Camada de dados e validação

- [x] 7.1 `src/lib/db/mappers.ts`: `toSecretSantaParticipant` (linha →
      `SecretSantaParticipant` de `src/lib/types.ts`).
- [x] 7.2 `src/lib/db/secretSanta.ts`: `joinSecretSanta`,
      `updateSecretSantaWishlist`, `getMySecretSantaParticipation` (RPCs de
      convidado, recebem client anônimo), `listSecretSantaParticipants`,
      `addSecretSantaExclusion`, `removeSecretSantaExclusion`,
      `runSecretSantaDraw`, `redoSecretSantaDraw`, `getSecretSantaStatus`
      (RPCs de quem administra), `getMySecretSanta` (revelação).
- [x] 7.3 `src/lib/db/errors.ts`: `SecretSantaError` + mapa de código
      (`convite_invalido`, `modulo_desabilitado`, `sorteio_ja_realizado`,
      `nome_duplicado`, `participantes_insuficientes`,
      `sorteio_impossivel`, `sorteio_nao_realizado`, `ja_revelado_recusa`),
      seguindo o padrão de `MenuVoteError`.
- [x] 7.4 `src/lib/validation/secretSanta.ts`: schemas Zod de adesão
      (`displayName` não vazio, limite de tamanho), wishlist (array de
      strings, máximo de itens igual ao da tela atual) e exclusão (dois
      participant ids distintos).

## 8. Rotas de API

- [x] 8.1 `src/app/api/amigo-secreto/[token]/route.ts`: `GET` devolve
      participação atual do convidado (`getMySecretSantaParticipation`);
      `POST` adere (`joinSecretSanta`) ou atualiza wishlist
      (`updateSecretSantaWishlist`), conforme o convidado já ter entrado.
- [x] 8.2 `src/app/api/amigo-secreto/[token]/revelacao/route.ts`: `GET`
      chama `getMySecretSanta`, devolve estado "não sorteado" ou o par
      revelado.
- [x] 8.3 `src/app/api/eventos/[slug]/amigo-secreto/route.ts`: `GET` (quem
      administra) lista participantes via `listSecretSantaParticipants` +
      `getSecretSantaStatus`.
- [x] 8.4 `src/app/api/eventos/[slug]/amigo-secreto/exclusoes/route.ts`:
      `POST`/`DELETE` de restrições de par.
- [x] 8.5 `src/app/api/eventos/[slug]/amigo-secreto/sorteio/route.ts`:
      `POST` dispara `runSecretSantaDraw`; `PUT` (ou `POST` com corpo
      distinto) dispara `redoSecretSantaDraw`.
- [x] 8.6 Todas as rotas seguem o padrão de erro de `cardapio`/`rsvp`:
      capturar `SecretSantaError`, devolver 400/404/409 com a mensagem
      mapeada; qualquer outro erro sobe (500).

## 9. Frontend

- [x] 9.1 `src/app/e/[slug]/amigo-secreto/page.tsx`: ler `?convite=` de
      `searchParams` (igual `rsvp/page.tsx`), passar `token` para
      `SecretSantaSignup`.
- [x] 9.2 `SecretSantaSignup.tsx`: substituir estado local mockado por
      `fetch` real em `/api/amigo-secreto/[token]` (`GET` no mount para
      prefill, `POST` ao salvar), tratando `sem token` (sem `?convite=`) como
      link inválido — mesma tela de aviso que `RsvpFlow` usa hoje.
- [x] 9.3 `src/app/e/[slug]/amigo-secreto/revelacao/page.tsx`: repassar
      `token` para `SecretSantaReveal`.
- [x] 9.4 `SecretSantaReveal.tsx`: substituir fixture por `fetch` em
      `/api/amigo-secreto/[token]/revelacao`, tratando os três estados
      (sorteio não realizado, aguardando abrir, revelado).
- [ ] 9.5 **Adiado** — nenhum outro backend módulo já implementado
      (`add-menu-poll-backend`, `add-gifts-payments-backend`) criou uma tela
      em `/painel` para o anfitrião gerenciar o módulo; não existe mock a
      substituir aqui, ao contrário das telas de convidado. Construir uma do
      zero está fora do escopo de "sorteia o que as telas já prontas
      precisam" do proposal. As rotas de gestão (8.3-8.5) já expõem tudo que
      essa tela precisaria. Sinalizado ao final da implementação para decisão
      do usuário.
- [x] 9.6 Remover `src/lib/fixtures/secret-santa.ts` depois que as três telas
      não dependerem mais dele — mantido só `SECRET_SANTA_CONFIG` (valor
      sugerido e datas), que é configuração de exibição fora do escopo deste
      change, não dado mockado de participante/sorteio.

## 10. Testes

- [x] 10.1 `tests/secret-santa.test.mjs`: adesão (sucesso, nome duplicado,
      após sorteio, módulo desabilitado), wishlist, exclusões.
- [x] 10.2 Mesmo arquivo: sorteio — derangement válido em grupo pequeno,
      participantes insuficientes, restrições respeitadas, restrições sem
      solução falha sem gravar nada, execuções concorrentes só uma vence
      (usar duas chamadas simultâneas via `Promise.all`).
- [x] 10.3 Mesmo arquivo: sigilo — anfitrião não recebe par por nenhuma rota;
      participante só vê o próprio par; revelação persiste entre chamadas;
      refazer sorteio falha após qualquer revelação e funciona antes.
- [x] 10.4 `tests/rls.test.mjs`: adicionar casos das 5 tabelas novas —
      nenhum `select` anônimo/autenticado comum alcança
      `secret_santa_assignments`/`secret_santa_reveals`.
