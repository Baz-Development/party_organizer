-- Efetiva o resultado de uma notificação de pagamento já verificada.
--
-- Só `service_role` executa esta função — nunca `anon`/`authenticated`. Se
-- fosse alcançável pelo convidado, qualquer requisição forjada poderia
-- "confirmar" um pagamento sem nunca ter pago (design.md, decisão 6). A
-- verificação de assinatura do webhook acontece antes, na rota
-- `POST /api/pagamentos/webhook`, que é o único lugar do projeto autorizado a
-- instanciar o client `service_role` para este fim.
--
-- Idempotência ("Requirement: Idempotência do processamento de
-- notificações"): cada ramo só age se o pagamento estiver no estado que essa
-- transição espera (`pendente` para aprovar/recusar, `pago` para
-- reembolsar); fora disso devolve `applied = false` sem tocar em nada — a
-- segunda entrega do mesmo evento, ou uma entrega fora de ordem contra um
-- pagamento já em estado terminal, vira no-op. `for update` trava a linha do
-- pagamento e do presente antes de decidir, para que duas notificações
-- concorrentes do mesmo pagamento não corram por cima uma da outra.

create function public.process_payment_event(
  p_payment_id          uuid,
  p_provider_payment_id text,
  p_event_type          text,
  p_amount_cents        integer
)
returns table (
  applied     boolean,
  reason      text,
  payment_id  uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
  v_gift    public.gifts;
  v_add     integer;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;

  if not found then
    return query select false, 'pagamento_nao_encontrado'::text, p_payment_id;
    return;
  end if;

  if p_event_type = 'aprovado' then
    if v_payment.status <> 'pendente' then
      return query select false, 'ja_processado'::text, v_payment.id;
      return;
    end if;

    update public.payments
    set status = 'pago',
        confirmed_at = now(),
        provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id)
    where id = v_payment.id;

    select * into v_gift from public.gifts where id = v_payment.gift_id for update;

    if v_payment.reservation_id is not null then
      update public.gift_reservations set status = 'concluida' where id = v_payment.reservation_id;
      update public.gifts set status = 'comprado' where id = v_gift.id;
    else
      v_add := least(v_payment.amount_cents, greatest(0, v_gift.quota_target_cents - v_gift.quota_raised_cents));
      update public.gifts
      set quota_raised_cents = quota_raised_cents + v_add,
          quota_reserved_cents = greatest(0, quota_reserved_cents - v_payment.amount_cents),
          status = case when quota_raised_cents + v_add >= quota_target_cents then 'comprado' else status end
      where id = v_gift.id;
    end if;

    return query select true, null::text, v_payment.id;

  elsif p_event_type = 'recusado' then
    if v_payment.status <> 'pendente' then
      return query select false, 'ja_processado'::text, v_payment.id;
      return;
    end if;

    update public.payments set status = 'falho' where id = v_payment.id;

    if v_payment.reservation_id is not null then
      update public.gift_reservations set status = 'cancelada' where id = v_payment.reservation_id;
      update public.gifts set status = 'disponivel' where id = v_payment.gift_id and status = 'reservado';
    else
      update public.gifts
      set quota_reserved_cents = greatest(0, quota_reserved_cents - v_payment.amount_cents)
      where id = v_payment.gift_id;
    end if;

    return query select true, null::text, v_payment.id;

  elsif p_event_type = 'reembolsado' then
    if v_payment.status <> 'pago' then
      return query select false, 'estado_invalido_para_reembolso'::text, v_payment.id;
      return;
    end if;

    update public.payments set status = 'reembolsado', refunded_at = now() where id = v_payment.id;

    if v_payment.reservation_id is not null then
      update public.gifts set status = 'disponivel' where id = v_payment.gift_id;
    else
      update public.gifts
      set quota_raised_cents = greatest(0, quota_raised_cents - v_payment.amount_cents),
          status = case when status = 'comprado' then 'disponivel' else status end
      where id = v_payment.gift_id;
    end if;

    return query select true, null::text, v_payment.id;

  else
    return query select false, 'tipo_desconhecido'::text, v_payment.id;
  end if;
end;
$$;

-- Postgres concede `execute` a `PUBLIC` por padrão em toda função nova — ao
-- contrário de tabela, que o Supabase não auto-expõe (ver comentário em
-- `supabase/config.toml`). Sem o `revoke` abaixo, `anon`/`authenticated`
-- teriam conseguido chamar esta função diretamente e "confirmar" pagamento
-- sem nunca ter pago, justamente o que design.md, decisão 6, existe para
-- evitar.
revoke execute on function public.process_payment_event(uuid, text, text, integer) from public;
grant execute on function public.process_payment_event(uuid, text, text, integer) to service_role;
