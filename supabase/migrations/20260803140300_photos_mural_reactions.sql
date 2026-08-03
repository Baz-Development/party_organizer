-- Fotos de galeria, recados de mural e curtidas.
--
-- `visitor_id` é um uuid gerado no navegador (localStorage), não uma FK —
-- é a identidade de quem não tem conta nem convite, usada tanto para limitar
-- envios por intervalo quanto para curtidas idempotentes. `guest_id` é
-- preenchido quando o autor veio por token de convite (`add-guests-rsvp-backend`)
-- e fica null para autor "solto" (lista aberta / mural sem token).

create table public.photos (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  guest_id     uuid references public.guests (id) on delete set null,
  visitor_id   uuid not null,
  author       text not null,
  caption      text,
  storage_path text not null unique,
  status       public.photo_status not null default 'pendente',
  likes_count  integer not null default 0 check (likes_count >= 0),
  created_at   timestamptz not null default now()
);

create index photos_event_status_idx on public.photos (event_id, status, created_at desc);
create index photos_event_visitor_idx on public.photos (event_id, visitor_id, created_at);

create table public.mural_messages (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  guest_id    uuid references public.guests (id) on delete set null,
  visitor_id  uuid not null,
  author      text not null,
  message     text not null check (char_length(message) between 1 and 1000),
  status      public.mural_status not null default 'pendente',
  likes_count integer not null default 0 check (likes_count >= 0),
  created_at  timestamptz not null default now()
);

create index mural_messages_event_status_idx on public.mural_messages (event_id, status, created_at desc);
create index mural_messages_event_visitor_idx on public.mural_messages (event_id, visitor_id, created_at);

-- Curtida: uma linha por (alvo, visitante). O unique é o que torna a curtida
-- repetida um no-op em vez de um erro que o cliente precisa tratar.
create table public.reactions (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  target_type public.reaction_target not null,
  target_id   uuid not null,
  visitor_id  uuid not null,
  created_at  timestamptz not null default now(),
  unique (target_type, target_id, visitor_id)
);

create index reactions_event_idx on public.reactions (event_id);
create index reactions_target_idx on public.reactions (target_type, target_id);
