-- Funções que atravessam a RLS de `menu_polls`/`menu_options`/`menu_votes`
-- de forma controlada para o caminho do convidado, que nunca tem
-- `auth.uid()`. Mesmo padrão de `20260803130400_guest_functions.sql`:
-- `security definer`, `search_path` vazio, grant explícito para `anon` e
-- `authenticated`.

-- Enquetes de cardápio publicamente visíveis de um evento, com opções e
-- apuração agregada. Função em vez de política de select em `menu_votes`
-- porque a apuração cruza votos individuais, que não podem ser lidos linha a
-- linha por quem não administra o evento — só a contagem por opção.
create function public.get_menu_polls_publicos(p_event_slug text)
returns table (
  poll_id     uuid,
  course      text,
  question    text,
  closes_at   timestamptz,
  max_choices integer,
  option_id   uuid,
  option_name text,
  option_desc text,
  option_tags text[],
  votes       bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select mp.id, mp.course, mp.question, mp.closes_at, mp.max_choices,
         mo.id, mo.name, mo.description, mo.tags,
         count(mv.id)
  from public.events e
  join public.event_modules m on m.event_id = e.id and m.module = 'cardapio'
  join public.menu_polls mp on mp.event_id = e.id
  join public.menu_options mo on mo.poll_id = mp.id
  left join public.menu_votes mv on mv.option_id = mo.id
  where e.slug = p_event_slug and e.status = 'publicado'
  group by mp.id, mo.id
  order by mp.created_at, mo.created_at;
$$;

-- Escolhas atuais do convidado identificado pelo token, para a página do
-- cardápio pré-marcar o que ele já votou sem expor `guest_id` nem outras
-- linhas de `menu_votes`.
create function public.get_menu_votes_by_token(p_token text)
returns table (poll_id uuid, option_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select mv.poll_id, mv.option_id
  from public.guest_invites gi
  join public.menu_votes mv on mv.guest_id = gi.guest_id
  where gi.token = p_token;
$$;

-- Grava o voto de um convidado identificado por token numa enquete. Valida
-- módulo habilitado, prazo e pertencimento das opções dentro da função, para
-- que a regra não dependa de a rota Next.js lembrar de checar.
--
-- Troca de voto: apaga as linhas antigas do convidado nessa enquete e
-- reinsere o novo conjunto, em vez de upsert linha a linha — o conjunto pode
-- mudar de tamanho. `pg_advisory_xact_lock` serializa envios concorrentes do
-- mesmo convidado na mesma enquete, para que dois envios simultâneos não
-- intercalem apagar/inserir e deixem um conjunto misto: o lock é liberado só
-- no fim da transação da chamada, então o segundo envio espera o primeiro
-- terminar por completo.
create function public.submit_menu_vote(
  p_token text,
  p_poll_id uuid,
  p_option_ids uuid[]
)
returns setof uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest       public.guests;
  v_poll        public.menu_polls;
  v_count       integer;
  v_distinct    integer;
  v_valid_count integer;
begin
  select g.* into v_guest
  from public.guest_invites gi
  join public.guests g on g.id = gi.guest_id
  where gi.token = p_token;

  if not found then
    raise exception 'convite_invalido' using errcode = 'P0001';
  end if;

  select * into v_poll from public.menu_polls where id = p_poll_id;

  if not found or v_poll.event_id <> v_guest.event_id then
    raise exception 'enquete_invalida' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.event_modules m
    where m.event_id = v_poll.event_id and m.module = 'cardapio'
  ) then
    raise exception 'modulo_desabilitado' using errcode = 'P0001';
  end if;

  if now() > v_poll.closes_at then
    raise exception 'prazo_encerrado' using errcode = 'P0001';
  end if;

  v_count := coalesce(array_length(p_option_ids, 1), 0);

  if v_count < 1 then
    raise exception 'escolha_vazia' using errcode = 'P0001';
  end if;

  if v_count > v_poll.max_choices then
    raise exception 'excesso_de_escolhas' using errcode = 'P0001';
  end if;

  select count(distinct x) into v_distinct from unnest(p_option_ids) as x;
  if v_distinct <> v_count then
    raise exception 'opcao_duplicada' using errcode = 'P0001';
  end if;

  select count(*) into v_valid_count
  from public.menu_options mo
  where mo.poll_id = p_poll_id and mo.id = any(p_option_ids);

  if v_valid_count <> v_count then
    raise exception 'opcao_invalida' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_poll_id::text || ':' || v_guest.id::text));

  delete from public.menu_votes where poll_id = p_poll_id and guest_id = v_guest.id;

  insert into public.menu_votes (poll_id, guest_id, option_id)
  select p_poll_id, v_guest.id, opt
  from unnest(p_option_ids) as opt;

  return query select opt from unnest(p_option_ids) as opt;
end;
$$;

grant execute on function public.get_menu_polls_publicos(text) to anon, authenticated;
grant execute on function public.get_menu_votes_by_token(text) to anon, authenticated;
grant execute on function public.submit_menu_vote(text, uuid, uuid[]) to anon, authenticated;
