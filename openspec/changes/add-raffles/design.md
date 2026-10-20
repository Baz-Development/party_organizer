## Context

O módulo segue o desenho do amigo secreto: dados escopados por evento, autorização por `can_manage_event`, regras de negócio sensíveis (quem ganha) dentro de funções `security definer`, erros como códigos curtos `raise exception '<código>'` traduzidos em `src/lib/db/errors.ts`. A diferença é que aqui não há sigilo — a anfitriã vê tudo — mas há **integridade**: ela não pode escolher o vencedor nem mexer na urna depois de começar.

## Goals / Non-Goals

**Goals**
- Configuração simples: prêmios ordenados com quantidade de vencedores, suplentes, participantes vindos da lista de convidados.
- Vencedor decidido pelo banco, atômico, sem repetição, resistente a cliques duplos e abas concorrentes.
- Bloqueio de inscrições ao começar.
- Tela de apresentação teatral, sem dependência nova (CSS 3D + Web Audio + canvas).

**Non-Goals**
- Inscrição do próprio convidado (pela página pública) — participantes vêm só da lista da anfitriã.
- Transmissão ao vivo para os celulares dos convidados.
- Peso/chance diferente por participante.

## Decisions

### Ciclo de vida

`aberto` → (`start_raffle`) → `em_andamento` → (última vaga ou `finish_raffle`) → `encerrado`.
`reopen_raffle` volta a `aberto` só sem resultados; `reset_raffle` apaga resultados e volta a `aberto` de qualquer estado. `mark_raffle_result_absent` reabre `encerrado` → `em_andamento`.

`status`, `locked_at` e `finished_at` ficam **fora do grant de update** de `authenticated`: só mudam pelas funções.

### Vagas

Uma vaga = uma unidade de prêmio (`quantity`) ou um suplente. A próxima vaga é a primeira de `raffle_prizes` (por `position`, `created_at`) com menos resultados `valido` que `quantity`; sem nenhuma, um suplente se `alternates_count` ainda não foi atingido. `src/lib/raffle-slots.ts` espelha essa regra só para exibição.

### Escolha do vencedor

`draw_raffle_winner` trava a linha do sorteio (`select ... for update`), escolhe a vaga, escolhe `order by gen_random_uuid() limit 1` entre participantes sem nenhum resultado (válido ou ausente), grava e devolve. `gen_random_uuid()` usa `pg_strong_random()`. `unique (raffle_id, participant_id)` e `unique (raffle_id, sequence)` são a segunda linha de defesa.

O palco recebe o nome já decidido e anima a urna até ele — a animação não influencia o resultado, e recarregar a página não perde nada.

### Congelamento

Trigger `_raffle_guard_config` (`before insert/update/delete` em `raffle_prizes`, `before insert/delete` em `raffle_participants`) recusa com `sorteio_bloqueado` quando o sorteio não está `aberto`. Remoções em cascata (excluir sorteio/evento) rodam com `pg_trigger_depth() > 1` e passam. O mesmo trigger sobrescreve `event_id` com o do sorteio e confere que o convidado é do mesmo evento. `raffle_participants` não tem trigger de update para que o `on delete set null` de `guest_id` (convidado removido) funcione mesmo com o sorteio bloqueado — o nome fica preservado em `display_name`.

### Modo de participação

`raffles.participant_mode` (`selecionados` | `todos` | `confirmados`, padrão `selecionados`). Nos modos automáticos, `start_raffle` chama `_raffle_sync_participants` **antes** de mudar o status (depois o trigger de congelamento recusaria): remove quem deixou de ser elegível, inclui quem é novo e mantém quem continua. Assim, quem foi cadastrado ou confirmou até o clique em "Começar" entra sem a anfitriã atualizar nada. `todos` é literal — inclui pendentes e recusados; quem quer só os presentes usa `confirmados`. O modo é configuração: `_raffle_guard_alternates` o trava fora de `aberto`. Enquanto o sorteio está aberto, `participantCount` devolvido pela API é a prévia de convidados elegíveis naquele instante.

Migration: `20261019130000_raffle_participant_mode.sql`.

### Schema

```sql
create type public.raffle_status as enum ('aberto', 'em_andamento', 'encerrado');
create type public.raffle_result_status as enum ('valido', 'ausente');

create table public.raffles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,           -- 1..120
  description text,              -- <= 500
  alternates_count integer not null default 0,  -- 0..50
  status public.raffle_status not null default 'aberto',
  locked_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.raffle_prizes (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null, description text, image_path text,
  quantity integer not null default 1,   -- 1..100
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.raffle_participants (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  guest_id uuid references public.guests (id) on delete set null,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (raffle_id, guest_id)
);

create table public.raffle_results (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  participant_id uuid not null references public.raffle_participants (id) on delete cascade,
  prize_id uuid references public.raffle_prizes (id) on delete cascade, -- null = suplente
  sequence integer not null,
  status public.raffle_result_status not null default 'valido',
  drawn_at timestamptz not null default now(),
  drawn_by uuid references auth.users (id),
  unique (raffle_id, participant_id),
  unique (raffle_id, sequence)
);
```

### RLS

```sql
create policy raffles_manage on public.raffles for all to authenticated
  using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));
create policy raffle_prizes_manage on public.raffle_prizes for all to authenticated
  using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));
create policy raffle_participants_manage on public.raffle_participants for all to authenticated
  using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));
create policy raffle_results_manage_read on public.raffle_results for select to authenticated
  using (public.can_manage_event(event_id));

grant select, delete on public.raffles to authenticated;
grant insert (event_id, title, description, alternates_count) on public.raffles to authenticated;
grant update (title, description, alternates_count) on public.raffles to authenticated;
grant select, insert, update, delete on public.raffle_prizes to authenticated;
grant select, insert, delete on public.raffle_participants to authenticated;
grant select on public.raffle_results to authenticated;
```

Nenhuma policy para `anon`. Nenhuma policy de escrita em `raffle_results`.

### Tela de apresentação

- Camada `fixed inset-0` sobre o painel (sem rota fora de `/painel`, reaproveita o guard do layout).
- Urna: cilindro CSS 3D de 16 faces girando em `rotateX`, com as faces de trás reaproveitadas para os próximos nomes (funciona com qualquer número de participantes). Animação por `requestAnimationFrame` escrevendo direto no DOM: aceleração de 0,9 s + desaceleração `easeOutQuart` de 6,4 s até a face do vencedor.
- Som sintetizado com Web Audio (tic por nome, rufar, fanfarra) — nenhum arquivo de áudio; liga no primeiro clique, botão de mudo.
- Confete dourado em canvas com giro 3D simulado.
- `prefers-reduced-motion`: giro curto e sem partículas.
- Atalhos: espaço/enter (ação principal), F (tela cheia), M (som).

## Variáveis de ambiente

Nenhuma variável nova.

## Risks / Trade-offs

- **Anfitriã "ensaia" e esquece de recomeçar** → o painel mostra os resultados e o botão "Recomeçar do zero" em destaque quando há resultados.
- **Vários prêmios iguais com quantidade alta** → uma vaga por unidade; prêmios de até 100 vencedores, o palco esconde os pontos de progresso acima de 60 vagas.
- **Lista de convidados grande** → participantes gravados em lote de 150 ids por requisição (`.in(...)` vai na query string).
