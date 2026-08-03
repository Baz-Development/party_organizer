-- Histórico append-only de cada envio de RSVP. `guests` guarda só o estado
-- atual; esta tabela é o que torna "vale a resposta mais recente" auditável.

create table public.rsvp_responses (
  id           uuid primary key default gen_random_uuid(),
  guest_id     uuid not null references public.guests (id) on delete cascade,
  event_id     uuid not null references public.events (id) on delete cascade,
  status       public.rsvp_status not null,
  companions   integer not null default 0 check (companions >= 0),
  kids         integer not null default 0 check (kids >= 0),
  dietary      text,
  responded_at timestamptz not null default now()
);

create index rsvp_responses_guest_idx on public.rsvp_responses (guest_id, responded_at desc);
