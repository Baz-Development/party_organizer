-- Revelação e status: os dois únicos pontos de leitura de
-- `secret_santa_assignments`. Mensagens de erro genéricas, sem nome nem id
-- de participante, para que nenhuma resposta de erro vaze pareamento por
-- inferência.

-- Identifica o participante pelo token, resolve seu par como "dador" e
-- registra a revelação (upsert: a primeira chamada grava `revealed_at`, as
-- seguintes devolvem a mesma linha sem sobrescrever). Se o sorteio ainda não
-- ocorreu, devolve `drawn = false` em vez de erro — a tela trata os dois
-- estados.
create function public.get_my_secret_santa(p_token text)
returns table (
  drawn              boolean,
  receiver_name      text,
  receiver_wishlist  text[],
  revealed_at        timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.secret_santa_participants;
  v_assignment  public.secret_santa_assignments;
  v_receiver    public.secret_santa_participants;
  v_wishlist    public.secret_santa_wishlists;
  v_reveal      public.secret_santa_reveals;
begin
  select p.* into v_participant
  from public.guest_invites gi
  join public.secret_santa_participants p on p.guest_id = gi.guest_id
  where gi.token = p_token;

  if not found then
    raise exception 'convite_invalido' using errcode = 'P0001';
  end if;

  select a.* into v_assignment
  from public.secret_santa_assignments a
  join public.secret_santa_draws d on d.id = a.draw_id
  where d.event_id = v_participant.event_id
    and a.giver_participant_id = v_participant.id;

  if not found then
    return query select false, null::text, null::text[], null::timestamptz;
    return;
  end if;

  select * into v_receiver from public.secret_santa_participants where id = v_assignment.receiver_participant_id;
  select * into v_wishlist from public.secret_santa_wishlists where participant_id = v_receiver.id;

  insert into public.secret_santa_reveals (assignment_id)
  values (v_assignment.id)
  on conflict (assignment_id) do nothing;

  select * into v_reveal from public.secret_santa_reveals where assignment_id = v_assignment.id;

  return query select true, v_receiver.display_name, v_wishlist.items, v_reveal.revealed_at;
end;
$$;

-- Status para quem administra: só contagem e se já sorteou, nunca um par.
create function public.get_secret_santa_status(p_event_id uuid)
returns table (
  participant_count bigint,
  drawn_at          timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'sem_permissao' using errcode = 'P0001';
  end if;

  return query
  select
    (select count(*) from public.secret_santa_participants p where p.event_id = p_event_id),
    (select d.executed_at from public.secret_santa_draws d where d.event_id = p_event_id);
end;
$$;

grant execute on function public.get_my_secret_santa(text) to anon, authenticated;
grant execute on function public.get_secret_santa_status(uuid) to authenticated;
