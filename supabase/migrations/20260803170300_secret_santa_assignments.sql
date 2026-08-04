-- Os pares do sorteio. Sem policy de select para ninguém além de
-- `service_role` — ver `20260803170600_rls_secret_santa.sql`. Só a função
-- `get_my_secret_santa` (security definer) lê esta tabela.

create table public.secret_santa_assignments (
  id                    uuid primary key default gen_random_uuid(),
  draw_id               uuid not null references public.secret_santa_draws (id) on delete cascade,
  giver_participant_id  uuid not null references public.secret_santa_participants (id) on delete cascade,
  receiver_participant_id uuid not null references public.secret_santa_participants (id) on delete cascade,
  check (giver_participant_id <> receiver_participant_id),
  unique (draw_id, giver_participant_id),
  unique (draw_id, receiver_participant_id)
);

create index secret_santa_assignments_draw_idx on public.secret_santa_assignments (draw_id);
