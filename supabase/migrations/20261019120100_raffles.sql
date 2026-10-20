-- Sorteios de prêmios de um evento.
--
-- Um evento pode ter vários sorteios ("Lembrancinhas", "Grande sorteio"...).
-- Cada sorteio tem:
--   * prêmios ordenados (`raffle_prizes.position` é a ordem em que são
--     sorteados no palco; `quantity` é quantos vencedores levam aquele prêmio);
--   * suplentes (`raffles.alternates_count`), sorteados depois de todos os
--     prêmios, para o caso de algum vencedor não estar presente;
--   * participantes escolhidos pela anfitriã na lista de convidados;
--   * resultados, gravados um a um pelo próprio banco (`draw_raffle_winner`).
--
-- Ciclo de vida (`raffles.status`):
--   aberto        → configuração e participantes editáveis;
--   em_andamento  → a anfitriã começou o sorteio: participantes, prêmios e
--                   suplentes congelados (`_raffle_guard_config`);
--   encerrado     → todas as vagas preenchidas, ou encerrado manualmente.
-- `status` só muda pelas funções de `20261019120200_raffle_functions.sql`
-- (o grant de update de `raffles` não inclui a coluna).

create type public.raffle_status as enum ('aberto', 'em_andamento', 'encerrado');

-- `ausente`: o nome foi sorteado, mas a pessoa não estava lá para receber — a
-- vaga do prêmio volta a ficar livre e o nome não volta para a urna.
create type public.raffle_result_status as enum ('valido', 'ausente');

create table public.raffles (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events (id) on delete cascade,
  title             text not null check (char_length(btrim(title)) between 1 and 120),
  description       text check (description is null or char_length(description) <= 500),
  alternates_count  integer not null default 0 check (alternates_count between 0 and 50),
  status            public.raffle_status not null default 'aberto',
  locked_at         timestamptz,
  finished_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index raffles_event_idx on public.raffles (event_id);

create trigger raffles_touch_updated_at
before update on public.raffles
for each row
execute function public.touch_updated_at();

-- `event_id` repetido nas tabelas filhas para a RLS não precisar de join;
-- o trigger `_raffle_guard_config` o sobrescreve com o do sorteio, então um
-- cliente não consegue pendurar um prêmio num sorteio de outro evento.
create table public.raffle_prizes (
  id           uuid primary key default gen_random_uuid(),
  raffle_id    uuid not null references public.raffles (id) on delete cascade,
  event_id     uuid not null references public.events (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 160),
  description  text check (description is null or char_length(description) <= 500),
  -- Path no bucket `event-media` ("{event_id}/{uuid}.{ext}"), como `gifts.image_path`.
  image_path   text,
  quantity     integer not null default 1 check (quantity between 1 and 100),
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index raffle_prizes_raffle_idx on public.raffle_prizes (raffle_id, position);

create trigger raffle_prizes_touch_updated_at
before update on public.raffle_prizes
for each row
execute function public.touch_updated_at();

-- Participante = convidado escolhido pela anfitriã. `display_name` é uma
-- cópia do nome no momento da inclusão: se o convidado for removido depois
-- (`on delete set null`), o resultado de um sorteio já feito continua legível.
create table public.raffle_participants (
  id            uuid primary key default gen_random_uuid(),
  raffle_id     uuid not null references public.raffles (id) on delete cascade,
  event_id      uuid not null references public.events (id) on delete cascade,
  guest_id      uuid references public.guests (id) on delete set null,
  display_name  text not null check (char_length(btrim(display_name)) between 1 and 160),
  created_at    timestamptz not null default now(),
  unique (raffle_id, guest_id)
);

create index raffle_participants_raffle_idx on public.raffle_participants (raffle_id);

-- `prize_id` nulo = suplente. `unique (raffle_id, participant_id)` é o que
-- garante que ninguém é sorteado duas vezes no mesmo sorteio, nem quando
-- marcado como ausente.
create table public.raffle_results (
  id              uuid primary key default gen_random_uuid(),
  raffle_id       uuid not null references public.raffles (id) on delete cascade,
  event_id        uuid not null references public.events (id) on delete cascade,
  participant_id  uuid not null references public.raffle_participants (id) on delete cascade,
  prize_id        uuid references public.raffle_prizes (id) on delete cascade,
  sequence        integer not null check (sequence > 0),
  status          public.raffle_result_status not null default 'valido',
  drawn_at        timestamptz not null default now(),
  drawn_by        uuid references auth.users (id),
  unique (raffle_id, participant_id),
  unique (raffle_id, sequence)
);

create index raffle_results_prize_idx on public.raffle_results (prize_id);

-- ---------------------------------------------------------------------------
-- Congelamento da configuração depois que o sorteio começa.
--
-- Prêmios e participantes só mudam com o sorteio `aberto`. Exceção: remoção
-- em cascata (apagar o sorteio ou o evento inteiro) — nesse caso o trigger
-- roda aninhado no trigger de FK (`pg_trigger_depth() > 1`) e não interfere.
-- ---------------------------------------------------------------------------

create function public._raffle_guard_config()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raffle_id uuid := coalesce(new.raffle_id, old.raffle_id);
  v_raffle    public.raffles;
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  select * into v_raffle from public.raffles where id = v_raffle_id;

  if found and v_raffle.status <> 'aberto' then
    raise exception 'sorteio_bloqueado' using errcode = 'P0001';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if not found then
    raise exception 'sorteio_nao_encontrado' using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' and new.raffle_id <> old.raffle_id then
    raise exception 'sorteio_nao_encontrado' using errcode = 'P0001';
  end if;

  new.event_id := v_raffle.event_id;

  -- Participante precisa ser convidado do mesmo evento do sorteio. `if`
  -- aninhado de propósito: `new.guest_id` só existe em `raffle_participants`,
  -- e o PL/pgSQL não garante curto-circuito dentro de uma mesma expressão.
  if tg_table_name = 'raffle_participants' then
    if new.guest_id is not null and not exists (
      select 1 from public.guests g
      where g.id = new.guest_id and g.event_id = v_raffle.event_id
    ) then
      raise exception 'participante_invalido' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public._raffle_guard_config() from public, anon, authenticated;

create trigger raffle_prizes_guard_config
before insert or update or delete on public.raffle_prizes
for each row
execute function public._raffle_guard_config();

-- Só insert/delete: o `on delete set null` de `guest_id` é um update feito
-- pela própria FK e precisa passar mesmo com o sorteio em andamento.
create trigger raffle_participants_guard_config
before insert or delete on public.raffle_participants
for each row
execute function public._raffle_guard_config();

-- Suplentes também são configuração: mudam só com o sorteio aberto. Título e
-- descrição podem ser corrigidos a qualquer momento (aparecem no palco).
create function public._raffle_guard_alternates()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.alternates_count <> old.alternates_count and old.status <> 'aberto' then
    raise exception 'sorteio_bloqueado' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public._raffle_guard_alternates() from public, anon, authenticated;

create trigger raffles_guard_alternates
before update of alternates_count on public.raffles
for each row
execute function public._raffle_guard_alternates();
