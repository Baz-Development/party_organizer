-- Ciclo de vida e sorteio dos prêmios, inteiramente dentro do banco.
--
-- Todas as funções públicas daqui:
--   * são `security definer` e checam `can_manage_event` — só quem administra
--     o evento conduz o sorteio;
--   * travam a linha do sorteio (`for update`) antes de qualquer decisão, o
--     que serializa cliques repetidos e abas concorrentes: duas chamadas de
--     `draw_raffle_winner` nunca escolhem a mesma vaga nem a mesma pessoa;
--   * levantam códigos curtos (`raise exception '<código>'`) que
--     `src/lib/db/errors.ts` traduz para mensagem.
--
-- Aleatoriedade: `order by gen_random_uuid()`. O UUID v4 vem de
-- `pg_strong_random()` (fonte criptográfica do sistema), diferente de
-- `random()`, que é um gerador pseudoaleatório semeável.

-- Trava o sorteio e confere permissão/módulo. Sem grant: só alcançável de
-- dentro das funções abaixo, que rodam como o dono do schema.
create function public._raffle_lock_for_manager(p_raffle_id uuid)
returns public.raffles
language plpgsql
set search_path = ''
as $$
declare
  v_raffle public.raffles;
begin
  select * into v_raffle from public.raffles where id = p_raffle_id for update;

  -- Sorteio inexistente e sorteio de outro evento são indistinguíveis.
  if not found or not public.can_manage_event(v_raffle.event_id) then
    raise exception 'sorteio_nao_encontrado' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.event_modules m
    where m.event_id = v_raffle.event_id and m.module = 'sorteios'
  ) then
    raise exception 'modulo_desabilitado' using errcode = 'P0001';
  end if;

  return v_raffle;
end;
$$;

revoke execute on function public._raffle_lock_for_manager(uuid) from public, anon, authenticated;

-- Quantas vagas ainda faltam: unidades de prêmio sem vencedor válido +
-- suplentes ainda não sorteados.
create function public._raffle_remaining_slots(p_raffle public.raffles)
returns integer
language sql
stable
set search_path = ''
as $$
  select
    coalesce((
      select sum(greatest(p.quantity - (
        select count(*) from public.raffle_results r
        where r.prize_id = p.id and r.status = 'valido'
      ), 0))
      from public.raffle_prizes p
      where p.raffle_id = p_raffle.id
    ), 0)::integer
    + greatest(p_raffle.alternates_count - (
        select count(*) from public.raffle_results r
        where r.raffle_id = p_raffle.id and r.prize_id is null and r.status = 'valido'
      )::integer, 0);
$$;

revoke execute on function public._raffle_remaining_slots(public.raffles) from public, anon, authenticated;

-- Começar o sorteio: bloqueia a lista de participantes (e o resto da
-- configuração) até reabrir ou recomeçar.
create function public.start_raffle(p_raffle_id uuid)
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

  if not exists (select 1 from public.raffle_participants p where p.raffle_id = v_raffle.id) then
    raise exception 'sem_participantes' using errcode = 'P0001';
  end if;

  update public.raffles
     set status = 'em_andamento', locked_at = now(), finished_at = null
   where id = v_raffle.id
  returning * into v_raffle;

  return v_raffle;
end;
$$;

-- Reabrir as inscrições: só antes do primeiro nome sorteado. Depois disso,
-- mexer na urna mudaria as chances de quem ainda concorre — o caminho é
-- `reset_raffle`, que descarta os resultados.
create function public.reopen_raffle(p_raffle_id uuid)
returns public.raffles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raffle public.raffles;
begin
  v_raffle := public._raffle_lock_for_manager(p_raffle_id);

  if v_raffle.status = 'aberto' then
    return v_raffle;
  end if;

  if exists (select 1 from public.raffle_results r where r.raffle_id = v_raffle.id) then
    raise exception 'sorteio_com_resultados' using errcode = 'P0001';
  end if;

  update public.raffles
     set status = 'aberto', locked_at = null, finished_at = null
   where id = v_raffle.id
  returning * into v_raffle;

  return v_raffle;
end;
$$;

-- Recomeçar do zero: apaga todos os resultados e reabre. Serve para o ensaio
-- antes da festa e para corrigir um sorteio que começou errado.
create function public.reset_raffle(p_raffle_id uuid)
returns public.raffles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raffle public.raffles;
begin
  v_raffle := public._raffle_lock_for_manager(p_raffle_id);

  delete from public.raffle_results r where r.raffle_id = v_raffle.id;

  update public.raffles
     set status = 'aberto', locked_at = null, finished_at = null
   where id = v_raffle.id
  returning * into v_raffle;

  return v_raffle;
end;
$$;

-- Encerrar antes de preencher todas as vagas (ex.: acabaram os presentes na
-- urna, ou a anfitriã decidiu parar).
create function public.finish_raffle(p_raffle_id uuid)
returns public.raffles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raffle public.raffles;
begin
  v_raffle := public._raffle_lock_for_manager(p_raffle_id);

  if v_raffle.status = 'aberto' then
    raise exception 'sorteio_nao_iniciado' using errcode = 'P0001';
  end if;

  if v_raffle.status = 'encerrado' then
    return v_raffle;
  end if;

  update public.raffles
     set status = 'encerrado', finished_at = now()
   where id = v_raffle.id
  returning * into v_raffle;

  return v_raffle;
end;
$$;

-- Sorteia o próximo nome. A vaga é decidida aqui, não pelo cliente: primeiro
-- prêmio (na ordem de `position`) que ainda tem unidade livre; depois dos
-- prêmios, os suplentes. Quem já saiu — válido ou ausente — não volta à urna.
create function public.draw_raffle_winner(p_raffle_id uuid)
returns table (
  result_id       uuid,
  participant_id  uuid,
  display_name    text,
  prize_id        uuid,
  sequence        integer,
  remaining       integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raffle       public.raffles;
  v_prize_id     uuid;
  v_alternates   integer;
  v_participant  public.raffle_participants;
  v_sequence     integer;
  v_result_id    uuid;
  v_remaining    integer;
begin
  v_raffle := public._raffle_lock_for_manager(p_raffle_id);

  if v_raffle.status = 'aberto' then
    raise exception 'sorteio_nao_iniciado' using errcode = 'P0001';
  end if;

  if v_raffle.status = 'encerrado' then
    raise exception 'sorteio_concluido' using errcode = 'P0001';
  end if;

  select p.id into v_prize_id
  from public.raffle_prizes p
  where p.raffle_id = v_raffle.id
    and p.quantity > (
      select count(*) from public.raffle_results r
      where r.prize_id = p.id and r.status = 'valido'
    )
  order by p.position, p.created_at
  limit 1;

  if v_prize_id is null then
    select count(*) into v_alternates
    from public.raffle_results r
    where r.raffle_id = v_raffle.id and r.prize_id is null and r.status = 'valido';

    if v_alternates >= v_raffle.alternates_count then
      raise exception 'sorteio_concluido' using errcode = 'P0001';
    end if;
  end if;

  select * into v_participant
  from public.raffle_participants pp
  where pp.raffle_id = v_raffle.id
    and not exists (
      select 1 from public.raffle_results r where r.participant_id = pp.id
    )
  order by gen_random_uuid()
  limit 1;

  if not found then
    raise exception 'participantes_esgotados' using errcode = 'P0001';
  end if;

  select coalesce(max(r.sequence), 0) + 1 into v_sequence
  from public.raffle_results r
  where r.raffle_id = v_raffle.id;

  insert into public.raffle_results (raffle_id, event_id, participant_id, prize_id, sequence, drawn_by)
  values (v_raffle.id, v_raffle.event_id, v_participant.id, v_prize_id, v_sequence, (select auth.uid()))
  returning id into v_result_id;

  v_remaining := public._raffle_remaining_slots(v_raffle);

  -- Última vaga preenchida: o sorteio se encerra sozinho. Se ainda sobrar
  -- vaga mas não sobrar ninguém na urna, fica em andamento — a anfitriã vê o
  -- aviso no palco e encerra quando quiser.
  if v_remaining = 0 then
    update public.raffles
       set status = 'encerrado', finished_at = now()
     where id = v_raffle.id;
  end if;

  return query
  select v_result_id, v_participant.id, v_participant.display_name, v_prize_id, v_sequence, v_remaining;
end;
$$;

-- Marca um nome sorteado como ausente: a vaga do prêmio volta a ficar livre
-- para o próximo sorteio, e a pessoa não concorre de novo.
create function public.mark_raffle_result_absent(p_result_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raffle_id uuid;
  v_raffle    public.raffles;
begin
  select r.raffle_id into v_raffle_id from public.raffle_results r where r.id = p_result_id;

  if v_raffle_id is null then
    raise exception 'resultado_nao_encontrado' using errcode = 'P0001';
  end if;

  v_raffle := public._raffle_lock_for_manager(v_raffle_id);

  update public.raffle_results
     set status = 'ausente'
   where id = p_result_id and status = 'valido';

  -- A vaga reaberta reabre o sorteio que tinha se encerrado sozinho.
  if v_raffle.status = 'encerrado' then
    update public.raffles
       set status = 'em_andamento', finished_at = null
     where id = v_raffle.id;
  end if;
end;
$$;

grant execute on function public.start_raffle(uuid) to authenticated;
grant execute on function public.reopen_raffle(uuid) to authenticated;
grant execute on function public.reset_raffle(uuid) to authenticated;
grant execute on function public.finish_raffle(uuid) to authenticated;
grant execute on function public.draw_raffle_winner(uuid) to authenticated;
grant execute on function public.mark_raffle_result_absent(uuid) to authenticated;

revoke execute on function public.start_raffle(uuid) from public, anon;
revoke execute on function public.reopen_raffle(uuid) from public, anon;
revoke execute on function public.reset_raffle(uuid) from public, anon;
revoke execute on function public.finish_raffle(uuid) from public, anon;
revoke execute on function public.draw_raffle_winner(uuid) from public, anon;
revoke execute on function public.mark_raffle_result_absent(uuid) from public, anon;
