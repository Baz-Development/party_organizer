-- Pares que não podem se tirar no sorteio. Par não ordenado: a unicidade usa
-- `least`/`greatest` para que (A, B) e (B, A) contem como a mesma restrição.

create table public.secret_santa_exclusions (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events (id) on delete cascade,
  participant_a_id  uuid not null references public.secret_santa_participants (id) on delete cascade,
  participant_b_id  uuid not null references public.secret_santa_participants (id) on delete cascade,
  created_at        timestamptz not null default now(),
  check (participant_a_id <> participant_b_id)
);

create unique index secret_santa_exclusions_pair_idx
  on public.secret_santa_exclusions (
    event_id,
    least(participant_a_id, participant_b_id),
    greatest(participant_a_id, participant_b_id)
  );

create index secret_santa_exclusions_event_idx on public.secret_santa_exclusions (event_id);
