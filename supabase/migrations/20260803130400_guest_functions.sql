-- Funções que atravessam a RLS de `guests`/`guest_invites` de forma
-- controlada para o caminho do convidado, que nunca tem `auth.uid()`. Mesmo
-- padrão de `20260803120500_authorization_functions.sql`: `security definer`,
-- `search_path` vazio, grant explícito para `anon` e `authenticated`.

-- Identifica o convidado pelo token e devolve o que a página de RSVP precisa
-- para prefill. Token inexistente ou de outro evento: nenhuma linha, sem
-- diferenciar os dois casos.
create function public.get_guest_by_invite_token(p_token text)
returns table (
  guest_id   uuid,
  event_id   uuid,
  name       text,
  status     public.rsvp_status,
  companions integer,
  kids       integer,
  dietary    text
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.event_id, g.name, g.status, g.companions, g.kids, g.dietary
  from public.guest_invites gi
  join public.guests g on g.id = gi.guest_id
  where gi.token = p_token;
$$;

-- Grava a resposta de um convidado identificado por token. Valida módulo
-- habilitado e prazo dentro da função, para que a regra não dependa de a
-- rota Next.js lembrar de checar.
create function public.submit_rsvp(
  p_token text,
  p_status public.rsvp_status,
  p_companions integer,
  p_kids integer,
  p_dietary text
)
returns public.guests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_event public.events;
begin
  select g.* into v_guest
  from public.guest_invites gi
  join public.guests g on g.id = gi.guest_id
  where gi.token = p_token;

  if not found then
    raise exception 'convite_invalido' using errcode = 'P0001';
  end if;

  select * into v_event from public.events e where e.id = v_guest.event_id;

  if not exists (
    select 1 from public.event_modules m
    where m.event_id = v_event.id and m.module = 'rsvp'
  ) then
    raise exception 'modulo_desabilitado' using errcode = 'P0001';
  end if;

  if v_event.rsvp_deadline is not null and now() > v_event.rsvp_deadline then
    raise exception 'prazo_encerrado' using errcode = 'P0001';
  end if;

  if p_status = 'recusado' then
    p_companions := 0;
    p_kids := 0;
  end if;

  update public.guests
  set status = p_status,
      companions = p_companions,
      kids = p_kids,
      dietary = p_dietary,
      responded_at = now()
  where id = v_guest.id
  returning * into v_guest;

  insert into public.rsvp_responses (guest_id, event_id, status, companions, kids, dietary)
  values (v_guest.id, v_guest.event_id, p_status, p_companions, p_kids, p_dietary);

  return v_guest;
end;
$$;

-- Lista aberta: cria o convidado "não listado" e já grava a primeira
-- resposta. Só aceita quando o evento está publicado e com lista aberta.
create function public.submit_open_rsvp(
  p_event_slug text,
  p_name text,
  p_status public.rsvp_status,
  p_companions integer,
  p_kids integer,
  p_dietary text
)
returns public.guests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_guest public.guests;
begin
  select * into v_event from public.events e where e.slug = p_event_slug;

  if not found or v_event.status <> 'publicado' or not v_event.guest_list_open then
    raise exception 'lista_fechada' using errcode = 'P0001';
  end if;

  if v_event.rsvp_deadline is not null and now() > v_event.rsvp_deadline then
    raise exception 'prazo_encerrado' using errcode = 'P0001';
  end if;

  if p_status = 'recusado' then
    p_companions := 0;
    p_kids := 0;
  end if;

  insert into public.guests (event_id, name, status, companions, kids, dietary, unlisted, responded_at)
  values (v_event.id, p_name, p_status, p_companions, p_kids, p_dietary, true, now())
  returning * into v_guest;

  insert into public.guest_invites (guest_id) values (v_guest.id);

  insert into public.rsvp_responses (guest_id, event_id, status, companions, kids, dietary)
  values (v_guest.id, v_event.id, p_status, p_companions, p_kids, p_dietary);

  return v_guest;
end;
$$;

grant execute on function public.get_guest_by_invite_token(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, public.rsvp_status, integer, integer, text) to anon, authenticated;
grant execute on function public.submit_open_rsvp(text, text, public.rsvp_status, integer, integer, text) to anon, authenticated;
