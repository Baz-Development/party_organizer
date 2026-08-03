-- Funções `security definer` do caminho do convidado sem conta para galeria
-- e mural — mesmo padrão de `20260803130400_guest_functions.sql`: o
-- convidado (`anon`) não tem política de RLS de `insert` genérica nestas
-- tabelas, então a escrita passa por aqui, que valida evento publicado,
-- módulo habilitado, autor e limite de envios dentro da mesma transação.
--
-- `assert_can_submit_*` é usada pela rota que emite a URL de upload assinada
-- (só a foto precisa; o recado do mural não sobe arquivo, então só tem
-- `submit_mural_message`). `submit_photo` repete as mesmas checagens no
-- momento da confirmação — a emissão da URL e a confirmação são dois
-- instantes diferentes, e o estado pode ter mudado entre eles.

-- Evento pelo slug, publicado e com o módulo habilitado — ou levanta o erro
-- de domínio correspondente.
create function public._require_published_module(p_event_slug text, p_module public.module_id)
returns public.events
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  select * into v_event from public.events e where e.slug = p_event_slug;

  if not found or v_event.status <> 'publicado' then
    raise exception 'evento_invalido' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.event_modules m
    where m.event_id = v_event.id and m.module = p_module
  ) then
    raise exception 'modulo_desabilitado' using errcode = 'P0001';
  end if;

  return v_event;
end;
$$;

-- Resolve o convidado pelo token de convite, quando informado. Token que não
-- resolve para nenhum convidado do evento é erro — token adulterado não deve
-- ser tratado como "sem token".
create function public._resolve_media_author(
  p_event_id uuid,
  p_guest_token text,
  p_author text
)
returns table (guest_id uuid, author text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_guest_id uuid;
  v_guest_name text;
begin
  if p_guest_token is not null then
    select g.id, g.name into v_guest_id, v_guest_name
    from public.guest_invites gi
    join public.guests g on g.id = gi.guest_id
    where gi.token = p_guest_token and g.event_id = p_event_id;

    if not found then
      raise exception 'convite_invalido' using errcode = 'P0001';
    end if;

    return query select v_guest_id, v_guest_name;
  end if;

  if p_author is null or btrim(p_author) = '' then
    raise exception 'autor_ausente' using errcode = 'P0001';
  end if;

  return query select null::uuid, btrim(p_author);
end;
$$;

create function public.assert_can_submit_photo(p_event_slug text, p_visitor_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_count integer;
begin
  v_event := public._require_published_module(p_event_slug, 'galeria');

  select count(*) into v_count
  from public.photos p
  where p.event_id = v_event.id
    and p.visitor_id = p_visitor_id
    and p.created_at > now() - interval '15 minutes';

  if v_count >= 10 then
    raise exception 'limite_envios' using errcode = 'P0001';
  end if;

  return v_event.id;
end;
$$;

create function public.submit_photo(
  p_event_slug text,
  p_storage_path text,
  p_author text,
  p_caption text,
  p_visitor_id uuid,
  p_guest_token text default null
)
returns public.photos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_count integer;
  v_guest_id uuid;
  v_author text;
  v_photo public.photos;
begin
  v_event := public._require_published_module(p_event_slug, 'galeria');

  if p_storage_path is null or p_storage_path !~ ('^' || v_event.id::text || '/') then
    raise exception 'caminho_invalido' using errcode = 'P0001';
  end if;

  select count(*) into v_count
  from public.photos p
  where p.event_id = v_event.id
    and p.visitor_id = p_visitor_id
    and p.created_at > now() - interval '15 minutes';

  if v_count >= 10 then
    raise exception 'limite_envios' using errcode = 'P0001';
  end if;

  select r.guest_id, r.author into v_guest_id, v_author
  from public._resolve_media_author(v_event.id, p_guest_token, p_author) r;

  insert into public.photos (event_id, guest_id, visitor_id, author, caption, storage_path, status)
  values (
    v_event.id,
    v_guest_id,
    p_visitor_id,
    v_author,
    nullif(btrim(coalesce(p_caption, '')), ''),
    p_storage_path,
    case when v_event.moderation_policy = 'imediata' then 'aprovada'::public.photo_status else 'pendente'::public.photo_status end
  )
  returning * into v_photo;

  return v_photo;
end;
$$;

create function public.submit_mural_message(
  p_event_slug text,
  p_author text,
  p_message text,
  p_visitor_id uuid,
  p_guest_token text default null
)
returns public.mural_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_count integer;
  v_guest_id uuid;
  v_author text;
  v_message text;
  v_row public.mural_messages;
begin
  v_event := public._require_published_module(p_event_slug, 'mural');

  v_message := btrim(coalesce(p_message, ''));
  if v_message = '' then
    raise exception 'mensagem_vazia' using errcode = 'P0001';
  end if;
  if char_length(v_message) > 1000 then
    raise exception 'mensagem_excede_limite' using errcode = 'P0001';
  end if;

  select count(*) into v_count
  from public.mural_messages m
  where m.event_id = v_event.id
    and m.visitor_id = p_visitor_id
    and m.created_at > now() - interval '15 minutes';

  if v_count >= 5 then
    raise exception 'limite_envios' using errcode = 'P0001';
  end if;

  select r.guest_id, r.author into v_guest_id, v_author
  from public._resolve_media_author(v_event.id, p_guest_token, p_author) r;

  insert into public.mural_messages (event_id, guest_id, visitor_id, author, message, status)
  values (
    v_event.id,
    v_guest_id,
    p_visitor_id,
    v_author,
    v_message,
    case when v_event.moderation_policy = 'imediata' then 'aprovada'::public.mural_status else 'pendente'::public.mural_status end
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Curtida idempotente: a segunda tentativa do mesmo visitante no mesmo alvo
-- não incrementa de novo. Só aceita alvo visível (aprovado) — curtir
-- pendente/oculta é recusado, inclusive para quem administra, porque
-- "curtida" é uma ação de público, não de moderação.
create function public.react_to_item(
  p_target_type public.reaction_target,
  p_target_id uuid,
  p_visitor_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_status text;
  v_inserted integer;
  v_likes integer;
begin
  if p_target_type = 'foto' then
    select event_id, status::text into v_event_id, v_status from public.photos where id = p_target_id;
  else
    select event_id, status::text into v_event_id, v_status from public.mural_messages where id = p_target_id;
  end if;

  if v_event_id is null or v_status <> 'aprovada' then
    raise exception 'item_nao_visivel' using errcode = 'P0001';
  end if;

  insert into public.reactions (event_id, target_type, target_id, visitor_id)
  values (v_event_id, p_target_type, p_target_id, p_visitor_id)
  on conflict (target_type, target_id, visitor_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    if p_target_type = 'foto' then
      update public.photos set likes_count = likes_count + 1 where id = p_target_id
      returning likes_count into v_likes;
    else
      update public.mural_messages set likes_count = likes_count + 1 where id = p_target_id
      returning likes_count into v_likes;
    end if;
  else
    if p_target_type = 'foto' then
      select likes_count into v_likes from public.photos where id = p_target_id;
    else
      select likes_count into v_likes from public.mural_messages where id = p_target_id;
    end if;
  end if;

  return v_likes;
end;
$$;

grant execute on function public.assert_can_submit_photo(text, uuid) to anon, authenticated;
grant execute on function public.submit_photo(text, text, text, text, uuid, text) to anon, authenticated;
grant execute on function public.submit_mural_message(text, text, text, uuid, text) to anon, authenticated;
grant execute on function public.react_to_item(public.reaction_target, uuid, uuid) to anon, authenticated;
