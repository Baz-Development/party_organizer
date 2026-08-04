-- Um sorteio por evento. `unique (event_id)` é o que impede duas execuções
-- simultâneas de coexistirem — a segunda `insert` esbarra na constraint
-- mesmo que o `pg_advisory_xact_lock` da função falhe por algum motivo.

create table public.secret_santa_draws (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null unique references public.events (id) on delete cascade,
  executed_at  timestamptz not null default now(),
  executed_by  uuid references auth.users (id)
);
