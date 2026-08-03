## Context

`/e/[slug]/cardapio` hoje usa `MENU_POLLS` de `src/lib/fixtures/menu.ts`: enquetes,
opções e contagens fixas. Votar não persiste nada.

A fundação (`add-supabase-foundation`) e o módulo de convidados/RSVP
(`add-guests-rsvp-backend`) já estão implementados e arquivados. Este change
reaproveita:

- `public.events`, `public.event_modules` (módulo `cardapio` já existe no enum
  `module_id`) e as funções de autorização de
  `20260803120500_authorization_functions.sql` (`can_manage_event`,
  `is_event_public`).
- `public.guests` e `public.guest_invites`, com o padrão de identificar o
  convidado por `token` opaco via função `security definer`, sem `auth.uid()` —
  o mesmo padrão de `submit_rsvp`/`get_guest_by_invite_token` em
  `20260803130400_guest_functions.sql`.

Não há variável de ambiente nova: o módulo usa a mesma conexão Supabase da
fundação (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, já declaradas em `.env.example`).

## Goals / Non-Goals

**Goals:**

- Persistir enquetes de cardápio (`menu_polls`), suas opções (`menu_options`) e
  os votos dos convidados (`menu_votes`).
- Garantir um único conjunto de escolhas por convidado por enquete, com troca
  permitida até o prazo, sem duplicar votos em envios concorrentes.
- Apurar o resultado a partir dos votos gravados (contagem por opção), visível
  tanto ao convidado na página do cardápio quanto ao anfitrião no painel.
- Fechar automaticamente a enquete no prazo (`closes_at`), recusando voto
  depois dele, sem estado "encerrada" que precise de job — o prazo já é a
  fonte da verdade.
- Substituir a fixture `src/lib/fixtures/menu.ts` por dados reais em
  `MenuVote.tsx`.

**Non-Goals:**

- Curadoria completa das enquetes pelo painel (tela dedicada de criação/edição
  visual). Este change entrega as rotas de API para curadoria (criar, editar,
  remover enquete/opção) e o layer de dados; a tela de curadoria em
  `/painel/editor` fica para trabalho de UI subsequente, fora do escopo de
  backend.
- Notificação por e-mail do encerramento da enquete (pertence a
  `add-transactional-emails`).
- Enquetes fora do contexto de um evento (ex.: template reutilizável entre
  eventos).

## Decisions

### Três tabelas, sem "publicado" separado do módulo

`menu_polls` (etapa, pergunta, prazo, limite de escolhas) → `menu_options`
(nome, descrição, tags) → `menu_votes` (uma linha por opção escolhida por
convidado por enquete). A visibilidade ao convidado não depende de um estado
de enquete: depende só do módulo `cardapio` estar habilitado no evento
(`event_modules`) e o evento estar `publicado`, igual ao restante do produto.
Isso evita um segundo campo de estado (`published`/`draft`) que teria que ficar
sincronizado com `event_modules`.

### Voto é uma linha por opção, não um array em uma coluna

`menu_votes (poll_id, guest_id, option_id)` com `unique (poll_id, guest_id,
option_id)`, em vez de uma coluna `option_ids uuid[]` em uma única linha por
voto. Isso permite:

- Apurar com `count(*) group by option_id`, sem desempacotar array.
- Reaproveitar `on delete cascade` em `option_id` — remover uma opção também
  remove os votos naquela opção, sem função extra.

O conjunto de escolhas de um convidado nessa enquete é "todas as linhas de
`menu_votes` com esse `(poll_id, guest_id)`".

### Troca de voto: apagar e reinserir dentro da função, com advisory lock

`submit_menu_vote(p_token, p_poll_id, p_option_ids)` é `security definer`,
segue o padrão de `submit_rsvp`: valida token, módulo habilitado e prazo dentro
da própria função. Para trocar o voto, a função apaga as linhas antigas do
convidado nessa enquete e insere o novo conjunto — não é upsert linha a linha,
porque o conjunto pode mudar de tamanho (de 1 escolha para 2, por exemplo).

Dois envios simultâneos do mesmo convidado poderiam intercalar
delete/insert e deixar um conjunto misto. A função serializa com
`pg_advisory_xact_lock(hashtext(poll_id || guest_id))` antes do
apagar+inserir: o lock é liberado no fim da transação da chamada, então a
segunda chamada espera a primeira terminar e só então roda seu próprio
apagar+inserir — nunca há intercalação, e o resultado final é sempre o de
quem "ganhou" a corrida (last-write-wins determinístico, sem erro para quem
perdeu).

Não uso índice único parcial nem `ON CONFLICT` (a cilada de upsert via
PostgREST contra índice parcial, documentada em
`add-guests-rsvp-backend`/`add-supabase-foundation`): o apagar+inserir roda
como SQL cru dentro da função `security definer`, sem passar pelo
inferidor de conflito do PostgREST.

### Apuração pública via função `security definer`, não política de select

O convidado não tem `auth.uid()`, então não há como escrever uma política RLS
de `select` em `menu_votes` para "quem sou eu": qualquer política de select
para `anon`/`authenticated` sem vínculo exporia o voto de todo mundo, não só a
contagem. Por isso:

- `menu_polls`/`menu_options`: política de select para `anon`/`authenticated`
  usa `public.is_event_public(event_id)` — mesmo padrão de conteúdo público do
  evento — porque pergunta/opções não identificam ninguém.
- `menu_votes`: sem política de select pública. A contagem chega ao convidado
  por `get_menu_polls_publicos(p_event_slug)`, função `security definer` que
  devolve enquete + opções + `count(menu_votes)` agregado, nunca uma linha de
  voto individual. O anfitrião (autenticado, `can_manage_event`) tem política
  de select direta em `menu_votes` para casos em que precisar auditar quem
  votou o quê.

### Prefill do voto do convidado via função dedicada

`get_menu_votes_by_token(p_token)` devolve `(poll_id, option_id)` das escolhas
atuais do convidado, no mesmo espírito de `get_guest_by_invite_token`: permite
a página pré-marcar o que ele já escolheu ao reabrir o link, sem expor
`guest_id` nem outras linhas de `menu_votes`.

### "Ao menos duas opções" e "prazo não é passado" — onde cada regra mora

- `max_choices >= 1` e `closes_at >= created_at`: `check constraint` na
  tabela — são regras de uma linha só, o banco garante mesmo se alguém
  escrever direto com a service role.
- "Ao menos duas opções por enquete": regra sobre o conjunto de opções, não
  uma linha. Fica na validação Zod da rota de criação (`POST
  /api/eventos/[slug]/cardapio`, que cria enquete + opções em uma chamada) —
  mesmo tratamento que `add-guests-rsvp-backend` deu a regras equivalentes
  (dedup de importação em lote na camada de aplicação, não em trigger).
- Remoção de opção votada exige confirmação: a rota de `DELETE` de opção
  checa se há `menu_votes` para ela e, se houver, só apaga com `?force=true`
  na query string — devolve 409 sem o parâmetro.

## Risks / Trade-offs

- **[Risco] Voto múltiplo por quem não é convidado identificado.** Mitigado:
  todo voto passa por `submit_menu_vote`, que só resolve `guest_id` a partir
  de `guest_invites.token` — sem token válido, não há `guest_id`, não há
  insert. Não existe política de insert direta em `menu_votes` para
  `anon`/`authenticated`.
- **[Risco] Apuração que o convidado vê diverge da que o anfitrião vê depois.**
  Mitigado: as duas leituras (`get_menu_polls_publicos` para o convidado,
  `select` direto em `menu_votes` para o anfitrião) contam a mesma tabela, sem
  cache nem tabela de contagem desnormalizada — a única forma de divergir é
  ler em instantes diferentes, o que é esperado (enquete aberta muda).
- **[Trade-off] Curadoria de enquete sem tela dedicada neste change.** As rotas
  de API e o layer de dados existem; falta só a UI de criação/edição em
  `/painel/editor`. Aceito porque o roadmap trata telas como trabalho
  incremental sobre o backend, e o proposal já lista isso como impacto de
  tela, não de dado.
- **[Risco] `pg_advisory_xact_lock` com `hashtext` pode colidir (dois pares
  `poll_id`/`guest_id` diferentes gerando o mesmo hash de 32 bits).** Aceito:
  colisão só causa serialização extra entre convidados diferentes (uma espera
  a outra apagar+inserir), nunca perda ou mistura de voto — é uma questão de
  performance sob concorrência muito alta, não de correção.

## Migration Plan

1. `menu_polls`, `menu_options`, `menu_votes` (tabelas + índices + checks).
2. `menu_functions.sql`: `get_menu_polls_publicos`, `get_menu_votes_by_token`,
   `submit_menu_vote`, com `grant execute` para `anon`/`authenticated`.
3. `rls_menu.sql`: RLS habilitada nas três tabelas, políticas de gestão para
   `authenticated` via `can_manage_event`, política de select pública para
   `menu_polls`/`menu_options` via `is_event_public`, grants explícitos
   (`authenticated`, `service_role` — a tabela é nova, o grant geral da
   fundação não alcança).
4. Depois de cada migration: `npx --no-install supabase db reset` local +
   `npm run db:types` para regenerar `src/lib/database.types.ts`.

Rollback: `supabase db reset` volta ao estado das migrations anteriores
(ambiente local); em staging/produção, uma migration reversa (`drop table`)
seria necessária, mas não há dado de produção ainda neste módulo.
