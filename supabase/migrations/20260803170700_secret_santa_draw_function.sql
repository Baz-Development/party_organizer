-- Sorteio do amigo secreto: derangement respeitando `secret_santa_exclusions`,
-- gerado inteiramente dentro do banco, atômico. Duas etapas:
--
-- 1. `_secret_santa_try` é o retrocesso (backtracking) recursivo: para cada
--    "dador" na ordem recebida, tenta um candidato aleatório do que sobrou no
--    grupo, recursa para o resto, e desiste do candidato se a recursão
--    provar impossível — clássica busca com retrocesso sobre um bipartite
--    matching com restrições. Não é `security definer` nem tem grant próprio:
--    só é alcançável de dentro de `run_secret_santa_draw`, que roda como o
--    dono do schema.
-- 2. `run_secret_santa_draw` tenta primeiro embaralhamentos aleatórios
--    (baratos, resolvem a esmagadora maioria dos grupos) antes de cair no
--    retrocesso, que só é necessário quando as exclusões apertam o grafo.

create function public._secret_santa_try(
  p_givers uuid[],
  p_idx int,
  p_pool uuid[],
  p_exclusion_pairs text[]
)
returns uuid[]
language plpgsql
as $$
declare
  v_giver     uuid;
  v_candidates uuid[];
  v_candidate uuid;
  v_rest      uuid[];
  v_sub       uuid[];
begin
  if p_idx > array_length(p_givers, 1) then
    return '{}'::uuid[];
  end if;

  v_giver := p_givers[p_idx];

  select array_agg(x order by random()) into v_candidates from unnest(p_pool) as x;

  foreach v_candidate in array v_candidates loop
    if v_candidate = v_giver then
      continue;
    end if;

    if (least(v_giver, v_candidate)::text || '_' || greatest(v_giver, v_candidate)::text)
        = any (p_exclusion_pairs) then
      continue;
    end if;

    select array_agg(x) into v_rest from unnest(p_pool) as x where x <> v_candidate;

    v_sub := public._secret_santa_try(p_givers, p_idx + 1, coalesce(v_rest, '{}'::uuid[]), p_exclusion_pairs);

    if v_sub is not null then
      return array_prepend(v_candidate, v_sub);
    end if;
  end loop;

  return null;
end;
$$;

create function public.run_secret_santa_draw(p_event_id uuid)
returns public.secret_santa_draws
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant_ids     uuid[];
  v_count               int;
  v_exclusion_pairs     text[];
  v_draw                public.secret_santa_draws;
  v_receivers           uuid[];
  v_candidate           uuid[];
  v_valid               boolean := false;
  v_attempt             int;
  v_max_random_attempts constant int := 200;
  v_i                   int;
begin
  perform pg_advisory_xact_lock(hashtext(p_event_id::text));

  if not public.can_manage_event(p_event_id) then
    raise exception 'sem_permissao' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.event_modules m
    where m.event_id = p_event_id and m.module = 'amigo-secreto'
  ) then
    raise exception 'modulo_desabilitado' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.secret_santa_draws d where d.event_id = p_event_id) then
    raise exception 'sorteio_ja_realizado' using errcode = 'P0001';
  end if;

  select array_agg(p.id order by p.joined_at) into v_participant_ids
  from public.secret_santa_participants p
  where p.event_id = p_event_id;

  v_count := coalesce(array_length(v_participant_ids, 1), 0);

  if v_count < 3 then
    raise exception 'participantes_insuficientes' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(
           least(e.participant_a_id, e.participant_b_id)::text || '_' ||
           greatest(e.participant_a_id, e.participant_b_id)::text
         ), '{}')
    into v_exclusion_pairs
  from public.secret_santa_exclusions e
  where e.event_id = p_event_id;

  for v_attempt in 1..v_max_random_attempts loop
    select array_agg(x order by random()) into v_candidate from unnest(v_participant_ids) as x;

    v_valid := true;
    for v_i in 1..v_count loop
      if v_candidate[v_i] = v_participant_ids[v_i] then
        v_valid := false;
        exit;
      end if;
      if (least(v_participant_ids[v_i], v_candidate[v_i])::text || '_' ||
          greatest(v_participant_ids[v_i], v_candidate[v_i])::text) = any (v_exclusion_pairs) then
        v_valid := false;
        exit;
      end if;
    end loop;

    exit when v_valid;
  end loop;

  if v_valid then
    v_receivers := v_candidate;
  else
    v_receivers := public._secret_santa_try(v_participant_ids, 1, v_participant_ids, v_exclusion_pairs);
  end if;

  if v_receivers is null then
    raise exception 'sorteio_impossivel' using errcode = 'P0001';
  end if;

  insert into public.secret_santa_draws (event_id, executed_by)
  values (p_event_id, (select auth.uid()))
  returning * into v_draw;

  insert into public.secret_santa_assignments (draw_id, giver_participant_id, receiver_participant_id)
  select v_draw.id, v_participant_ids[i], v_receivers[i]
  from generate_series(1, v_count) as i;

  return v_draw;
end;
$$;

-- Refazer: só permitido enquanto ninguém revelou. Apaga o sorteio atual
-- (cascade em `secret_santa_assignments`) e roda `run_secret_santa_draw` de
-- novo, na mesma transação — o `pg_advisory_xact_lock` de dentro dela é
-- reentrante para a mesma sessão, então não há espera própria.
create function public.redo_secret_santa_draw(p_event_id uuid)
returns public.secret_santa_draws
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draw public.secret_santa_draws;
begin
  perform pg_advisory_xact_lock(hashtext(p_event_id::text));

  if not public.can_manage_event(p_event_id) then
    raise exception 'sem_permissao' using errcode = 'P0001';
  end if;

  select * into v_draw from public.secret_santa_draws where event_id = p_event_id;

  if not found then
    raise exception 'sorteio_nao_realizado' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.secret_santa_reveals r
    join public.secret_santa_assignments a on a.id = r.assignment_id
    where a.draw_id = v_draw.id
  ) then
    raise exception 'ja_revelado_recusa' using errcode = 'P0001';
  end if;

  delete from public.secret_santa_draws where id = v_draw.id;

  return public.run_secret_santa_draw(p_event_id);
end;
$$;

grant execute on function public.run_secret_santa_draw(uuid) to authenticated;
grant execute on function public.redo_secret_santa_draw(uuid) to authenticated;
