-- Catálogo de presentes por evento.
--
-- Dinheiro em centavos (`integer`), não `numeric`: o client do Supabase
-- serializa `numeric` como string em JSON para não perder precisão, o que
-- empurraria a conversão para todo consumidor. `integer` soma e compara sem
-- arredondamento — a conversão para reais acontece uma vez só, em
-- `src/lib/db/mappers.ts`. Ver design.md, decisão 1.
--
-- `quota_target_cents is null` identifica presente simples;
-- `quota_target_cents is not null` identifica presente de cota.
-- `quota_reserved_cents` é o valor "em voo" de contribuições com pagamento
-- pendente — existe para que duas contribuições concorrentes não consigam,
-- juntas, ultrapassar a meta. Ver design.md, decisão 3.

create table public.gifts (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references public.events (id) on delete cascade,
  name                  text not null,
  category              text not null,
  price_cents           integer not null check (price_cents > 0),
  store                 text,
  note                  text,
  status                public.gift_status not null default 'disponivel',
  quota_target_cents    integer check (quota_target_cents is null or quota_target_cents > 0),
  quota_raised_cents    integer not null default 0 check (quota_raised_cents >= 0),
  quota_reserved_cents  integer not null default 0 check (quota_reserved_cents >= 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index gifts_event_idx on public.gifts (event_id);

create trigger gifts_touch_updated_at
before update on public.gifts
for each row
execute function public.touch_updated_at();
