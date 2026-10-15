-- Mural sem aprovação prévia (ata ALF Eventos, seção 4: "Moderação — Não
-- existiria"). O recado passa a nascer sempre `aprovada`, independentemente
-- da `moderation_policy` do evento — que continua valendo para a galeria.
-- O anfitrião mantém ocultar/remover (moderação reativa), sem fila de
-- pendentes. O recado também ganha uma foto opcional, no mesmo bucket e
-- com o mesmo prefixo `{event_id}/` da galeria.

alter table public.mural_messages add column photo_path text;

comment on column public.mural_messages.photo_path is
  'Path do objeto no bucket guest-uploads, prefixado por "{event_id}/". Nulo quando o recado não tem foto.';

-- Passivo: recados hoje pendentes num evento com política `previa` são
-- promovidos — não há mais fila que os aprovaria.
update public.mural_messages set status = 'aprovada' where status = 'pendente';

-- A assinatura muda (novo parâmetro): derruba a versão antiga antes de
-- recriar.
drop function if exists public.submit_mural_message(text, text, text, uuid, text);

create function public.submit_mural_message(
  p_event_slug text,
  p_author text,
  p_message text,
  p_visitor_id uuid,
  p_guest_token text default null,
  p_photo_path text default null
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

  if p_photo_path is not null and p_photo_path !~ ('^' || v_event.id::text || '/') then
    raise exception 'caminho_invalido' using errcode = 'P0001';
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

  -- Sempre `aprovada`: o mural não tem aprovação prévia.
  insert into public.mural_messages (event_id, guest_id, visitor_id, author, message, photo_path, status)
  values (
    v_event.id,
    v_guest_id,
    p_visitor_id,
    v_author,
    v_message,
    p_photo_path,
    'aprovada'::public.mural_status
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.submit_mural_message(text, text, text, uuid, text, text) to anon, authenticated;

-- Emissão da URL de upload da foto do recado: mesmo papel de
-- `assert_can_submit_photo`, mas checa o módulo `mural` (um evento pode ter
-- mural sem galeria) e o limite de envios do mural.
create function public.assert_can_submit_mural_photo(p_event_slug text, p_visitor_id uuid)
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
  v_event := public._require_published_module(p_event_slug, 'mural');

  select count(*) into v_count
  from public.mural_messages m
  where m.event_id = v_event.id
    and m.visitor_id = p_visitor_id
    and m.created_at > now() - interval '15 minutes';

  if v_count >= 5 then
    raise exception 'limite_envios' using errcode = 'P0001';
  end if;

  return v_event.id;
end;
$$;

grant execute on function public.assert_can_submit_mural_photo(text, uuid) to anon, authenticated;
