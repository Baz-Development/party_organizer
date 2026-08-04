-- RLS do amigo secreto.
--
-- `secret_santa_participants` pode ter policy de select comum para quem
-- administra: a wishlist não mora nessa tabela (vive em
-- `secret_santa_wishlists`), então essa policy nunca expõe lista de desejos
-- alheia — só id/display_name/joined_at/guest_id, para a tela de gestão.
--
-- `secret_santa_wishlists`, `secret_santa_assignments` e
-- `secret_santa_reveals` não têm NENHUMA policy de select para
-- `anon`/`authenticated`: o caminho do convidado passa só pelas funções
-- `security definer` de `20260803170500_secret_santa_join_functions.sql` e
-- `20260803170800_secret_santa_reveal_functions.sql`, que não são bloqueadas
-- pela RLS que elas mesmas atravessam. Isso vale inclusive para quem
-- administra o evento — nem o anfitrião lê um par direto da tabela.

alter table public.secret_santa_participants enable row level security;
alter table public.secret_santa_wishlists enable row level security;
alter table public.secret_santa_exclusions enable row level security;
alter table public.secret_santa_draws enable row level security;
alter table public.secret_santa_assignments enable row level security;
alter table public.secret_santa_reveals enable row level security;

create policy secret_santa_participants_manage_read on public.secret_santa_participants
for select to authenticated
using (public.can_manage_event(event_id));

create policy secret_santa_exclusions_manage on public.secret_santa_exclusions
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy secret_santa_draws_manage_read on public.secret_santa_draws
for select to authenticated
using (public.can_manage_event(event_id));

grant select on public.secret_santa_participants to authenticated;
grant select, insert, update, delete on public.secret_santa_exclusions to authenticated;
grant select on public.secret_santa_draws to authenticated;

-- `grant all on all tables in schema public to service_role` da fundação só
-- alcança tabela que já existia quando rodou; tabela criada depois precisa
-- do grant de novo.
grant all on
  public.secret_santa_participants,
  public.secret_santa_wishlists,
  public.secret_santa_exclusions,
  public.secret_santa_draws,
  public.secret_santa_assignments,
  public.secret_santa_reveals
to service_role;
