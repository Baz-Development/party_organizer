-- Opções de uma enquete de cardápio. "Ao menos duas opções por enquete" é
-- regra sobre o conjunto, não sobre uma linha — fica na validação da rota de
-- criação (`src/lib/validation/menu.ts`), não em constraint aqui.

create table public.menu_options (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references public.menu_polls (id) on delete cascade,
  name        text not null,
  description text,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index menu_options_poll_idx on public.menu_options (poll_id);
