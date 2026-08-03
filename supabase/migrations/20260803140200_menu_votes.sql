-- Voto do convidado: uma linha por opção escolhida, não um array em uma
-- única linha por voto. Permite apurar com `count(*) group by option_id` e
-- reaproveitar `on delete cascade` em `option_id` — remover uma opção também
-- remove os votos naquela opção, sem função extra.
--
-- O "conjunto de escolhas" de um convidado numa enquete é todo linha de
-- `menu_votes` com esse `(poll_id, guest_id)`; trocar o voto é apagar essas
-- linhas e inserir o novo conjunto, feito dentro de `submit_menu_vote`
-- (`20260803140300_menu_functions.sql`).

create table public.menu_votes (
  id         uuid primary key default gen_random_uuid(),
  poll_id    uuid not null references public.menu_polls (id) on delete cascade,
  guest_id   uuid not null references public.guests (id) on delete cascade,
  option_id  uuid not null references public.menu_options (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, guest_id, option_id)
);

create index menu_votes_poll_idx on public.menu_votes (poll_id);
create index menu_votes_option_idx on public.menu_votes (option_id);
create index menu_votes_guest_idx on public.menu_votes (guest_id);
