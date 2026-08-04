-- Funções que atravessam a RLS de `secret_santa_participants`/
-- `secret_santa_wishlists` de forma controlada para o caminho do convidado,
-- que nunca tem `auth.uid()`. Mesmo padrão de
-- `20260803130400_guest_functions.sql`/`20260803140300_menu_functions.sql`:
-- `security definer`, `search_path` vazio, grant explícito para `anon` e
-- `authenticated`.

-- Adesão: identifica o convidado pelo token, valida módulo habilitado,
-- sorteio ainda não realizado e nome de exibição não duplicado (comparação
-- sem diferenciar caixa, porque dois apelidos iguais confundiriam a
-- revelação de quem tirou quem).
create function public.join_secret_santa(p_token text, p_display_name text)
returns public.secret_santa_participants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest       public.guests;
  v_participant public.secret_santa_participants;
begin
  select g.* into v_guest
  from public.guest_invites gi
  join public.guests g on g.id = gi.guest_id
  where gi.token = p_token;

  if not found then
    raise exception 'convite_invalido' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.event_modules m
    where m.event_id = v_guest.event_id and m.module = 'amigo-secreto'
  ) then
    raise exception 'modulo_desabilitado' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.secret_santa_draws d where d.event_id = v_guest.event_id
  ) then
    raise exception 'sorteio_ja_realizado' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.secret_santa_participants p
    where p.event_id = v_guest.event_id
      and lower(p.display_name) = lower(p_display_name)
  ) then
    raise exception 'nome_duplicado' using errcode = 'P0001';
  end if;

  insert into public.secret_santa_participants (event_id, guest_id, display_name)
  values (v_guest.event_id, v_guest.id, p_display_name)
  returning * into v_participant;

  insert into public.secret_santa_wishlists (participant_id) values (v_participant.id);

  return v_participant;
end;
$$;

-- Wishlist: identifica o participante pelo token (via guest_invites) e
-- substitui o conteúdo. Não há trava de "após o sorteio" — o spec só exige
-- edição possível "até a revelação", e a revelação em si não muta a
-- wishlist; deixar aberto depois do sorteio e antes da revelação segue à
-- risca o que está escrito, sem inventar restrição adicional.
create function public.update_secret_santa_wishlist(p_token text, p_wishlist text[])
returns public.secret_santa_wishlists
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.secret_santa_participants;
  v_wishlist    public.secret_santa_wishlists;
begin
  select p.* into v_participant
  from public.guest_invites gi
  join public.secret_santa_participants p on p.guest_id = gi.guest_id
  where gi.token = p_token;

  if not found then
    raise exception 'convite_invalido' using errcode = 'P0001';
  end if;

  update public.secret_santa_wishlists
  set items = coalesce(p_wishlist, '{}')
  where participant_id = v_participant.id
  returning * into v_wishlist;

  return v_wishlist;
end;
$$;

-- Prefill da tela de cadastro: participação atual do convidado identificado
-- pelo token, se houver.
create function public.get_my_secret_santa_participation(p_token text)
returns table (
  participant_id uuid,
  display_name   text,
  wishlist       text[],
  joined_at      timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, w.items, p.joined_at
  from public.guest_invites gi
  join public.secret_santa_participants p on p.guest_id = gi.guest_id
  join public.secret_santa_wishlists w on w.participant_id = p.id
  where gi.token = p_token;
$$;

grant execute on function public.join_secret_santa(text, text) to anon, authenticated;
grant execute on function public.update_secret_santa_wishlist(text, text[]) to anon, authenticated;
grant execute on function public.get_my_secret_santa_participation(text) to anon, authenticated;
