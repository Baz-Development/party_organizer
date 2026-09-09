-- Substitui `submit_open_rsvp` (flag `guest_list_open`) por uma versão que
-- exige o token de auto-cadastro do evento. Mesmo padrão das demais funções do
-- caminho do convidado: `security definer`, `search_path` vazio, grant explícito
-- para `anon` e `authenticated`.
--
-- Token de 256 bits comparado por igualdade indexada — o vetor de timing não é
-- explorável nesse espaço, não há necessidade de comparação em tempo constante.

drop function if exists public.submit_open_rsvp(text, text, public.rsvp_status, integer, integer, text);

create function public.submit_self_signup_rsvp(
  p_event_slug text,
  p_signup_token text,
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
  select * into v_event
  from public.events e
  where e.slug = p_event_slug
    and e.status = 'publicado'
    and e.self_signup_token is not null
    and e.self_signup_token = p_signup_token;

  if not found then
    raise exception 'lista_fechada' using errcode = 'P0001';
  end if;

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

  insert into public.guests (event_id, name, status, companions, kids, dietary, unlisted, responded_at)
  values (v_event.id, p_name, p_status, p_companions, p_kids, p_dietary, true, now())
  returning * into v_guest;

  insert into public.guest_invites (guest_id) values (v_guest.id);

  insert into public.rsvp_responses (guest_id, event_id, status, companions, kids, dietary)
  values (v_guest.id, v_event.id, p_status, p_companions, p_kids, p_dietary);

  return v_guest;
end;
$$;

grant execute on function public.submit_self_signup_rsvp(text, text, text, public.rsvp_status, integer, integer, text) to anon, authenticated;
