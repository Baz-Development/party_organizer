-- RLS de enquetes de cardápio, opções e votos.
--
-- Quem administra o evento gerencia enquetes e opções, e lê os votos
-- diretamente (auditoria de quem votou o quê). Pergunta e opções são
-- conteúdo público do evento — igual a `schedule_items` — então
-- `anon`/`authenticated` sem vínculo também leem `menu_polls`/`menu_options`
-- quando o evento está publicado. `menu_votes` não tem política de select
-- pública: o caminho do convidado passa só pelas funções `security definer`
-- de `20260803140300_menu_functions.sql`, que apuram contagem sem expor
-- linha de voto individual.

alter table public.menu_polls enable row level security;
alter table public.menu_options enable row level security;
alter table public.menu_votes enable row level security;

create policy menu_polls_manage on public.menu_polls
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy menu_polls_read_public on public.menu_polls
for select to anon, authenticated
using (public.is_event_public(event_id));

create policy menu_options_manage on public.menu_options
for all to authenticated
using (public.can_manage_event((select event_id from public.menu_polls where id = poll_id)))
with check (public.can_manage_event((select event_id from public.menu_polls where id = poll_id)));

create policy menu_options_read_public on public.menu_options
for select to anon, authenticated
using (public.is_event_public((select event_id from public.menu_polls where id = poll_id)));

create policy menu_votes_read on public.menu_votes
for select to authenticated
using (public.can_manage_event((select event_id from public.menu_polls where id = poll_id)));

grant select, insert, update, delete on public.menu_polls to authenticated;
grant select on public.menu_polls to anon;
grant select, insert, update, delete on public.menu_options to authenticated;
grant select on public.menu_options to anon;
grant select on public.menu_votes to authenticated;

-- `grant all on all tables in schema public to service_role` de
-- `20260803121100_grants.sql` só alcança as tabelas que já existiam quando
-- rodou; tabela criada depois precisa do grant de novo.
grant all on public.menu_polls, public.menu_options, public.menu_votes to service_role;
