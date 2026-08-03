-- Funções do caminho do convidado (com ou sem conta) para o checkout de
-- presentes. Mesmo padrão de `20260803130400_guest_functions.sql`:
-- `security definer`, `search_path` vazio, grant explícito para `anon` e
-- `authenticated`, erro de domínio via `raise exception '<código>' using
-- errcode = 'P0001'`.
--
-- `start_gift_checkout` é o único lugar que decide o valor cobrado — nunca
-- aceita o preço vindo do cliente para presente simples ("Requirement:
-- Checkout com valor determinado pelo servidor"). Bifurca presente simples
-- (reserva com expiração) e presente de cota (contribuição contra
-- `quota_reserved_cents`, o valor "em voo" que impede duas contribuições
-- concorrentes de somarem mais que a meta — ver design.md, decisão 3).

create function public.start_gift_checkout(
  p_event_slug  text,
  p_gift_id     uuid,
  p_amount_cents integer,
  p_buyer_name  text,
  p_buyer_email text
)
returns table (
  payment_id              uuid,
  gift_id                 uuid,
  amount_cents            integer,
  currency                text,
  status                  public.payment_status,
  reservation_expires_at  timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event               public.events;
  v_gift                public.gifts;
  v_reservation          public.gift_reservations;
  v_reservation_id       uuid;
  v_payment_id           uuid;
  v_amount_cents         integer;
  v_remaining            integer;
  v_reservation_expires  timestamptz;
  v_buyer_name           text := nullif(trim(p_buyer_name), '');
  v_buyer_email          text := nullif(trim(p_buyer_email), '');
begin
  if v_buyer_name is null then
    raise exception 'comprador_invalido' using errcode = 'P0001';
  end if;

  select * into v_event from public.events e where e.slug = p_event_slug;
  if not found or v_event.status <> 'publicado' then
    raise exception 'evento_indisponivel' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.event_modules m
    where m.event_id = v_event.id and m.module = 'presentes'
  ) then
    raise exception 'modulo_desabilitado' using errcode = 'P0001';
  end if;

  select * into v_gift
  from public.gifts g
  where g.id = p_gift_id and g.event_id = v_event.id
  for update;

  if not found then
    raise exception 'presente_nao_encontrado' using errcode = 'P0001';
  end if;

  if v_gift.status = 'comprado' then
    raise exception 'presente_indisponivel' using errcode = 'P0001';
  end if;

  if v_gift.quota_target_cents is null then
    -- Presente simples: reserva com expiração, valor sempre o preço do banco.
    if v_gift.status = 'reservado' then
      select * into v_reservation
      from public.gift_reservations r
      where r.gift_id = v_gift.id and r.status = 'ativa';

      if found and v_reservation.expires_at > now() then
        raise exception 'presente_reservado' using errcode = 'P0001';
      elsif found then
        -- Reserva vencida sem pagamento confirmado: libera preguiçosamente
        -- (design.md, decisão 4) antes de reservar para quem chamou agora.
        update public.gift_reservations set status = 'expirada' where id = v_reservation.id;
      end if;
    end if;

    v_amount_cents := v_gift.price_cents;
    v_reservation_expires := now() + interval '30 minutes';

    insert into public.gift_reservations (gift_id, event_id, buyer_name, buyer_email, expires_at)
    values (v_gift.id, v_event.id, v_buyer_name, v_buyer_email, v_reservation_expires)
    returning id into v_reservation_id;

    update public.gifts set status = 'reservado' where id = v_gift.id;

    insert into public.payments (event_id, gift_id, reservation_id, buyer_name, buyer_email, amount_cents)
    values (v_event.id, v_gift.id, v_reservation_id, v_buyer_name, v_buyer_email, v_amount_cents)
    returning id into v_payment_id;
  else
    -- Presente de cota: valor escolhido pelo convidado, mas travado contra o
    -- restante sob o mesmo lock de linha — nenhuma contribuição concorrente
    -- ultrapassa a meta ("Requirement: Presente de cota").
    if p_amount_cents is null or p_amount_cents <= 0 then
      raise exception 'valor_invalido' using errcode = 'P0001';
    end if;

    v_remaining := v_gift.quota_target_cents - v_gift.quota_raised_cents - v_gift.quota_reserved_cents;

    if p_amount_cents > v_remaining then
      raise exception 'valor_excede_restante:%', v_remaining using errcode = 'P0001';
    end if;

    v_amount_cents := p_amount_cents;
    v_reservation_expires := null;

    update public.gifts
    set quota_reserved_cents = quota_reserved_cents + v_amount_cents
    where id = v_gift.id;

    insert into public.payments (event_id, gift_id, buyer_name, buyer_email, amount_cents)
    values (v_event.id, v_gift.id, v_buyer_name, v_buyer_email, v_amount_cents)
    returning id into v_payment_id;
  end if;

  return query
    select v_payment_id, v_gift.id, v_amount_cents, 'BRL'::text, 'pendente'::public.payment_status, v_reservation_expires;
end;
$$;

-- Registra a sessão do provedor num pagamento recém-criado. O `uuid` do
-- pagamento funciona como capability (mesmo padrão de `guest_invites.token`):
-- só quem recebeu o id de `start_gift_checkout` consegue completar este
-- passo, e só enquanto o pagamento ainda está `pendente` e sem sessão.
create function public.attach_checkout_session(
  p_payment_id          uuid,
  p_provider            text,
  p_provider_payment_id text
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
begin
  update public.payments
  set provider = p_provider,
      provider_payment_id = p_provider_payment_id
  where id = p_payment_id
    and status = 'pendente'
    and provider_payment_id is null
  returning * into v_payment;

  if not found then
    raise exception 'pagamento_invalido' using errcode = 'P0001';
  end if;

  return v_payment;
end;
$$;

-- Estado mínimo para a tela de sucesso perguntar "já confirmou?" sem
-- enxergar pagamentos de terceiros — o `uuid` funciona como capability, igual
-- às duas funções acima.
create function public.get_payment_status(p_payment_id uuid)
returns table (
  payment_id    uuid,
  status        public.payment_status,
  amount_cents  integer,
  currency      text,
  gift_id       uuid,
  gift_name     text,
  gift_status   public.gift_status
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.status, p.amount_cents, p.currency, g.id, g.name, g.status
  from public.payments p
  join public.gifts g on g.id = p.gift_id
  where p.id = p_payment_id;
$$;

grant execute on function public.start_gift_checkout(text, uuid, integer, text, text) to anon, authenticated;
grant execute on function public.attach_checkout_session(uuid, text, text) to anon, authenticated;
grant execute on function public.get_payment_status(uuid) to anon, authenticated;
