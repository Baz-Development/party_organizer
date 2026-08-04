## Context

O amigo secreto já tem duas telas prontas — `/e/[slug]/amigo-secreto` (cadastro
e lista de desejos) e `/e/[slug]/amigo-secreto/revelacao` — hoje alimentadas por
`src/lib/fixtures/secret-santa.ts`. Nenhuma delas sorteia nada.

O convidado chega a essas telas sem conta, do mesmo jeito que chega em
`/e/[slug]` e nas telas de RSVP e cardápio: pelo link do evento, identificado
por um cookie com o `token` de `guest_invites` (fundação já lançada em
`add-guests-rsvp-backend`). `add-menu-poll-backend` já resolveu o mesmo
problema — convidado sem `auth.uid()` votando em algo com regra de "um
conjunto por pessoa" — com funções `security definer` que recebem o token e
cruzam com `guest_invites`. Este change segue o mesmo padrão para adesão,
lista de desejos e revelação.

O que muda em relação aos módulos anteriores é o requisito de sigilo: em
`menu_votes`, quem administra o evento pode olhar os votos crus se quiser
depurar. Aqui não — nem o dono do evento, nem a organização, nem o admin da
plataforma podem ler os pares, em nenhuma rota, log ou mensagem de erro. Isso
empurra a leitura dos pares para dentro de uma função `security definer` que
verifica a identidade de quem pergunta antes de devolver qualquer linha, e
tira totalmente a leitura direto de tabela via RLS para essa tabela.

## Goals / Non-Goals

**Goals:**
- Participante entra pelo link do evento (mesmo token de convite do RSVP),
  cadastra um apelido de exibição e lista de desejos.
- Sorteio gera um derangement válido (ninguém tira a si mesmo, todos são
  tirados exatamente uma vez), respeitando restrições de par, em uma única
  transação atômica.
- Ninguém além do próprio sorteador lê seu par — nem por política de RLS, nem
  por função, nem por log/erro.
- Sorteio pode ser refeito enquanto ninguém revelou; trava depois da primeira
  revelação.

**Non-Goals:**
- Não cobre notificação por e-mail do link de revelação — isso é
  `add-transactional-emails`, que consome este módulo depois.
- Não cobre exclusão/saída de participante depois de cadastrado (fora do
  proposal).
- Não resolve empate/critério de "grupos" (ex.: casais no mesmo grupo não se
  tirarem automaticamente) além das restrições explícitas cadastradas — quem
  administra cadastra as restrições uma a uma.

## Decisions

### Participante é vinculado ao convidado pelo token, não por nome livre

`secret_santa_participants` referencia `guest_id` (de `guests`, identificado
via `guest_invites.token`, igual a `menu_votes`/RSVP). O "nome" do cenário de
cadastro é um campo de exibição (`display_name`) separado do `guests.name` —
a pessoa pode preferir um apelido no sorteio. `unique (event_id, guest_id)`
impede que o mesmo convidado entre duas vezes; a checagem de "nome duplicado"
do spec é uma validação adicional dentro da função de adesão, sobre
`display_name` (case-insensitive), porque dois participantes com o mesmo
apelido de exibição confundiriam a revelação de quem tirou quem.

**Alternativa rejeitada**: participante como entidade solta, sem `guest_id`,
identificado só por um token próprio gerado no cadastro. Rejeitada porque
duplicaria a máquina de token que `guest_invites` já resolve, e a revelação
por e-mail (`add-transactional-emails`) precisa do e-mail do convidado, que já
mora em `guests`.

### Sorteio: derangement com exclusões gerado dentro do Postgres, em uma função

A função `run_secret_santa_draw(p_event_id)` roda inteira em `plpgsql`,
`security definer`, dentro da transação da chamada:

1. `pg_advisory_xact_lock(hashtext(p_event_id::text))` serializa execuções
   concorrentes do mesmo evento — a segunda chamada espera a primeira
   terminar e então vê o sorteio já feito.
2. Valida: módulo habilitado, sorteio ainda não realizado
   (`secret_santa_draws` vazio para o evento), pelo menos 3 participantes.
3. Gera candidatos por embaralhamento aleatório (`order by random()`) e testa
   validade (sem ponto fixo, sem violar `secret_santa_exclusions`) até um
   limite de tentativas. Grupos pequenos (a esmagadora maioria dos eventos)
   resolvem em poucas tentativas.
4. Se o limite de tentativas aleatórias não encontrar solução, cai para uma
   busca com retrocesso (backtracking recursivo, participante por
   participante, candidatos embaralhados em cada nível) que encontra uma
   solução sempre que uma existe, ou prova que não existe.
5. Se não existe solução (restrições tornam o grafo impossível), a função
   levanta exceção e a transação não grava nada — nenhum par parcial.
6. Se existe, grava uma linha em `secret_santa_draws` e todas as linhas de
   `secret_santa_assignments` na mesma transação.

**Alternativa rejeitada**: gerar o derangement em código Next.js e só gravar
o resultado já pronto via uma função que apenas valida e insere. Rejeitada
porque abriria uma janela entre "calcular" e "gravar" em que duas chamadas
concorrentes da rota poderiam calcular resultados diferentes e a segunda
sobrescrever/duplicar; manter o algoritmo inteiro dentro da função com o
advisory lock elimina essa janela sem precisar de lock otimista na camada de
aplicação. O custo é reimplementar backtracking em `plpgsql`, aceitável dado
o tamanho típico de grupo (dezenas de pessoas).

### Sigilo dos pares: nenhuma política de RLS de leitura, só funções

`secret_santa_assignments` e `secret_santa_participants.wishlist` **não têm
policy de `select`** para `anon`/`authenticated` — só o `service_role` (usado
pelas próprias funções `security definer`) enxerga essas linhas. Duas funções
expõem exatamente o necessário:

- `get_my_secret_santa(p_token text)`: identifica o participante pelo token,
  devolve nome e wishlist de quem ele tirou, e registra a revelação (upsert
  em `secret_santa_reveals`) na mesma chamada. Se o sorteio não ocorreu,
  devolve estado "não sorteado" em vez de erro (a tela de revelação trata os
  dois casos).
- `get_secret_santa_status(p_event_id uuid)`: para quem administra
  (`can_manage_event`), devolve só contagem de participantes e se o sorteio
  já ocorreu — nunca um par.

Toda mensagem de erro dessas funções usa códigos genéricos
(`convite_invalido`, `sorteio_nao_realizado`, `sem_permissao`), nunca nomes
ou ids de participantes, para não vazar pareamento por inferência de erro.

**Alternativa considerada**: policy de select restrita a
`participant_id = current_participant_id()`, como se faz para dono de recurso
em outras tabelas do projeto. Rejeitada porque o convidado não tem
`auth.uid()` — a identidade vem só do token — então a policy precisaria da
mesma função `security definer` para resolver "quem está perguntando", e
nesse ponto a política de RLS não adiciona nada sobre simplesmente não expor
a tabela e resolver tudo na função.

### Refazer sorteio: bloqueado por qualquer revelação existente

`redo_secret_santa_draw(p_event_id)` verifica que `secret_santa_reveals` não
tem nenhuma linha para os participantes do sorteio atual do evento. Se
vazio, apaga o `secret_santa_draws` atual (cascade em `assignments`) e chama
`run_secret_santa_draw` de novo, na mesma transação. Se houver qualquer
revelação, recusa.

## Risks / Trade-offs

- **Backtracking em `plpgsql` para grupos muito grandes** → tempo de execução
  cresce com o número de participantes e de restrições. Mitigação: cenário
  do produto é festa/evento, não milhares de pessoas; limite de tentativas
  aleatórias cobre o caso comum e o backtracking só entra para grupos com
  restrições apertadas, tipicamente pequenos.
- **Erro genérico demais dificulta suporte** → quem administra recebe
  "sem_permissao" mesmo quando o problema real é outro, para não vazar
  informação sobre pares. Mitigação: log interno (sem par) com `event_id` e
  código de erro, para investigação sem expor quem tirou quem.
- **`service_role` mal configurado no cliente Next.js exporia as tabelas
  cruas** → se alguma rota usar o client de service role fora do server,
  furaria o sigilo. Mitigação: mesma regra já em vigor no projeto — chave de
  service role só em código server-only (`server-only` package), nunca em
  client component.

## Novas variáveis de ambiente

Nenhuma — este change não introduz provedor externo nem configuração nova de
ambiente, só tabelas, funções e RLS.
