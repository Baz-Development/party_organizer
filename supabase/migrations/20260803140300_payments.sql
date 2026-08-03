-- Registro de pagamento: um por checkout iniciado (presente simples) ou por
-- contribuição de cota. `reservation_id` só existe para presente simples;
-- contribuição de cota não reserva o presente, então fica nulo.
--
-- `provider`/`provider_payment_id` identificam o pagamento no provedor
-- externo — usados na conciliação ("Requirement: Rastro de auditoria dos
-- pagamentos"). `unique (provider, provider_payment_id)` permite múltiplos
-- pagamentos com `provider_payment_id` nulo (ainda não retornado pelo
-- provedor no momento da criação) sem colidir — o Postgres trata NULL como
-- distinto de si mesmo em constraint unique.

create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references public.events (id) on delete cascade,
  gift_id             uuid not null references public.gifts (id) on delete cascade,
  reservation_id      uuid references public.gift_reservations (id) on delete set null,
  buyer_name          text not null,
  buyer_email         text,
  amount_cents        integer not null check (amount_cents > 0),
  currency            text not null default 'BRL',
  provider            text not null default 'mock',
  provider_payment_id text,
  status              public.payment_status not null default 'pendente',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  confirmed_at        timestamptz,
  refunded_at         timestamptz,
  unique (provider, provider_payment_id)
);

create index payments_event_idx on public.payments (event_id);
create index payments_gift_idx on public.payments (gift_id);

create trigger payments_touch_updated_at
before update on public.payments
for each row
execute function public.touch_updated_at();
