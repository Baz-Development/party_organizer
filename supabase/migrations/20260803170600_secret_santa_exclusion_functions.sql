-- Restrições de par: gestão exclusiva de quem administra o evento.

create function public.add_secret_santa_exclusion(
  p_event_id uuid,
  p_participant_a uuid,
  p_participant_b uuid
)
returns public.secret_santa_exclusions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exclusion public.secret_santa_exclusions;
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'sem_permissao' using errcode = 'P0001';
  end if;

  if p_participant_a = p_participant_b then
    raise exception 'par_invalido' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.secret_santa_participants p
    where p.id = p_participant_a and p.event_id = p_event_id
  ) or not exists (
    select 1 from public.secret_santa_participants p
    where p.id = p_participant_b and p.event_id = p_event_id
  ) then
    raise exception 'participante_invalido' using errcode = 'P0001';
  end if;

  insert into public.secret_santa_exclusions (event_id, participant_a_id, participant_b_id)
  values (p_event_id, p_participant_a, p_participant_b)
  returning * into v_exclusion;

  return v_exclusion;
end;
$$;

create function public.remove_secret_santa_exclusion(p_exclusion_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
begin
  select event_id into v_event_id
  from public.secret_santa_exclusions
  where id = p_exclusion_id;

  if not found then
    return;
  end if;

  if not public.can_manage_event(v_event_id) then
    raise exception 'sem_permissao' using errcode = 'P0001';
  end if;

  delete from public.secret_santa_exclusions where id = p_exclusion_id;
end;
$$;

grant execute on function public.add_secret_santa_exclusion(uuid, uuid, uuid) to authenticated;
grant execute on function public.remove_secret_santa_exclusion(uuid) to authenticated;
