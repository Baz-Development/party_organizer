-- Modo de participação do sorteio.
--
--   selecionados → a anfitriã marca os convidados à mão (comportamento original);
--   todos        → todo convidado da lista do evento participa;
--   confirmados  → só quem confirmou presença no RSVP participa.
--
-- Nos modos automáticos a lista de `raffle_participants` é montada por
-- `start_raffle`, no instante em que o sorteio começa — quem foi cadastrado
-- (ou confirmou) até ali entra, sem a anfitriã precisar atualizar a lista.
-- Depois de começar, a lista congela como em qualquer sorteio.

create type public.raffle_participant_mode as enum ('selecionados', 'todos', 'confirmados');

alter table public.raffles
  add column participant_mode public.raffle_participant_mode not null default 'selecionados';

grant insert (participant_mode) on public.raffles to authenticated;
grant update (participant_mode) on public.raffles to authenticated;

-- O modo é configuração: só muda com o sorteio aberto, igual aos suplentes.
create or replace function public._raffle_guard_alternates()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'aberto' and (
    new.alternates_count <> old.alternates_count
    or new.participant_mode <> old.participant_mode
  ) then
    raise exception 'sorteio_bloqueado' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger raffles_guard_alternates on public.raffles;

create trigger raffles_guard_alternates
before update of alternates_count, participant_mode on public.raffles
for each row
execute function public._raffle_guard_alternates();

-- Sincroniza os participantes com a lista de convidados elegíveis pelo modo:
-- remove quem deixou de ser elegível (ou foi apagado), inclui quem é novo e
-- não toca em quem continua. Só chamada por `start_raffle`, com o sorteio
-- ainda aberto (o trigger de congelamento deixa passar).
create function public._raffle_sync_participants(p_raffle public.raffles)
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.raffle_participants rp
  where rp.raffle_id = p_raffle.id
    and not exists (
      select 1 from public.guests g
      where g.id = rp.guest_id
        and g.event_id = p_raffle.event_id
        and (p_raffle.participant_mode = 'todos' or g.status = 'confirmado')
    );

  insert into public.raffle_participants (raffle_id, event_id, guest_id, display_name)
  select p_raffle.id, p_raffle.event_id, g.id, g.name
  from public.guests g
  where g.event_id = p_raffle.event_id
    and (p_raffle.participant_mode = 'todos' or g.status = 'confirmado')
    and not exists (
      select 1 from public.raffle_participants rp
      where rp.raffle_id = p_raffle.id and rp.guest_id = g.id
    );
end;
$$;

revoke execute on function public._raffle_sync_participants(public.raffles) from public, anon, authenticated;

create or replace function public.start_raffle(p_raffle_id uuid)
returns public.raffles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raffle public.raffles;
begin
  v_raffle := public._raffle_lock_for_manager(p_raffle_id);

  if v_raffle.status <> 'aberto' then
    -- Idempotente: abrir o palco de novo num sorteio já começado não é erro.
    return v_raffle;
  end if;

  if not exists (select 1 from public.raffle_prizes p where p.raffle_id = v_raffle.id) then
    raise exception 'sem_premios' using errcode = 'P0001';
  end if;

  -- Antes de mudar o status: depois dele o trigger de congelamento recusaria.
  if v_raffle.participant_mode <> 'selecionados' then
    perform public._raffle_sync_participants(v_raffle);
  end if;

  if not exists (select 1 from public.raffle_participants p where p.raffle_id = v_raffle.id) then
    if v_raffle.participant_mode = 'selecionados' then
      raise exception 'sem_participantes' using errcode = 'P0001';
    end if;
    raise exception 'sem_convidados_elegiveis' using errcode = 'P0001';
  end if;

  update public.raffles
     set status = 'em_andamento', locked_at = now(), finished_at = null
   where id = v_raffle.id
  returning * into v_raffle;

  return v_raffle;
end;
$$;
