-- Enquete de cardápio: uma por etapa da refeição (entrada, prato principal,
-- sobremesa, bar, ...). `course` é texto livre — o produto não fecha o
-- vocabulário de etapas em enum, diferente de `module_id` ou `event_status`.

create table public.menu_polls (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  course      text not null,
  question    text not null,
  closes_at   timestamptz not null,
  max_choices integer not null default 1 check (max_choices >= 1),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index menu_polls_event_idx on public.menu_polls (event_id);

-- Mesmo tratamento de `events_rsvp_deadline_not_past`: prazo no passado é
-- rejeitado na origem, não só na validação da rota.
alter table public.menu_polls
  add constraint menu_polls_closes_at_not_past
  check (closes_at >= created_at);

create trigger menu_polls_touch_updated_at
before update on public.menu_polls
for each row
execute function public.touch_updated_at();
