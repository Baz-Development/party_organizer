-- Lista de convidados de um evento. Guarda o estado atual de cada um; o
-- histórico de cada resposta de RSVP vive em `rsvp_responses`.

create type public.rsvp_status as enum ('pendente', 'confirmado', 'recusado');

create table public.guests (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  name          text not null,
  group_name    text,
  email         text,
  phone         text,
  status        public.rsvp_status not null default 'pendente',
  companions    integer not null default 0 check (companions >= 0),
  kids          integer not null default 0 check (kids >= 0),
  dietary       text,
  -- Convidado criado pelo próprio fluxo de lista aberta, sem ter sido
  -- cadastrado antes pelo anfitrião.
  unlisted      boolean not null default false,
  invited_at    timestamptz not null default now(),
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index guests_event_idx on public.guests (event_id);
create index guests_event_status_idx on public.guests (event_id, status);

-- Deduplicação da importação em lote: mesmo nome + e-mail no mesmo evento
-- reaproveita o registro existente. Único parcial porque e-mail é opcional —
-- nome sozinho não deduplica (dois "Ana" são pessoas diferentes).
--
-- Índice em colunas simples (não `lower(...)`), de propósito: o upsert via
-- PostgREST só sabe inferir o índice de conflito por lista de colunas, não
-- por expressão. A normalização de caixa de `name`/`email` acontece na
-- camada de aplicação (`src/lib/db/guests.ts`) antes de gravar.
create unique index guests_event_name_email_idx
  on public.guests (event_id, name, email)
  where email is not null;

create trigger guests_touch_updated_at
before update on public.guests
for each row
execute function public.touch_updated_at();
