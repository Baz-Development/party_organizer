-- RLS de convidados, convites e respostas.
--
-- Só quem administra o evento lê/escreve estas tabelas diretamente. O
-- caminho do convidado (sem conta) passa exclusivamente pelas funções
-- `security definer` de `20260803130400_guest_functions.sql`, que não são
-- bloqueadas pela RLS que elas mesmas atravessam — por isso não existe
-- política de select para `anon`/`authenticated` sem vínculo aqui.

alter table public.guests enable row level security;
alter table public.guest_invites enable row level security;
alter table public.rsvp_responses enable row level security;

create policy guests_manage on public.guests
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy guest_invites_manage on public.guest_invites
for all to authenticated
using (public.can_manage_event((select event_id from public.guests where id = guest_id)))
with check (public.can_manage_event((select event_id from public.guests where id = guest_id)));

create policy rsvp_responses_read on public.rsvp_responses
for select to authenticated
using (public.can_manage_event(event_id));

grant select, insert, update, delete on public.guests to authenticated;
grant select, insert, update, delete on public.guest_invites to authenticated;
grant select on public.rsvp_responses to authenticated;

-- `grant all on all tables in schema public to service_role` de
-- `20260803121100_grants.sql` só alcança as tabelas que já existiam quando
-- rodou; tabela criada depois precisa do grant de novo.
grant all on public.guests, public.guest_invites, public.rsvp_responses to service_role;
