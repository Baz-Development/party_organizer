-- Reserva de presente simples (não-cota), com expiração.
--
-- `guest_id` é opcional porque quem reserva um presente pode ou não ser um
-- convidado identificado por token de convite — funciona sem
-- `add-guests-rsvp-backend` (proposal.md, "Depende de"). `buyer_name`/
-- `buyer_email` são a identidade mostrada ao anfitrião (RLS restringe a
-- leitura a quem administra o evento — ver `..._rls_gifts_payments.sql`).
--
-- Índice único parcial: no máximo uma reserva `ativa` por presente. Isto
-- nunca é alvo de `.upsert(onConflict:)` do client JS — a única escrita nesta
-- tabela acontece dentro de `start_gift_checkout` (SQL puro, com
-- `select ... for update`), o que evita a limitação de índice parcial como
-- alvo de `ON CONFLICT` do PostgREST. Ver design.md, riscos.

create table public.gift_reservations (
  id           uuid primary key default gen_random_uuid(),
  gift_id      uuid not null references public.gifts (id) on delete cascade,
  event_id     uuid not null references public.events (id) on delete cascade,
  guest_id     uuid references public.guests (id) on delete set null,
  buyer_name   text not null,
  buyer_email  text,
  status       public.reservation_status not null default 'ativa',
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

create index gift_reservations_gift_idx on public.gift_reservations (gift_id);
create index gift_reservations_event_idx on public.gift_reservations (event_id);

create unique index gift_reservations_active_idx
  on public.gift_reservations (gift_id)
  where status = 'ativa';
