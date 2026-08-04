-- Reivindicação atômica de mensagens pendentes para o processador da fila
-- (`src/lib/email/processQueue.ts`).
--
-- Um único `update ... where id in (select ... for update skip locked)`
-- muda `pendente` para `enviando` e devolve as linhas reivindicadas na mesma
-- instrução — atômico por si só, sem precisar de transação explícita.
-- `skip locked` é o que permite duas execuções sobrepostas do cron (ou o
-- best-effort de `after()` correndo junto com o cron) reivindicarem lotes
-- disjuntos em vez de brigar pela mesma linha (design.md, decisão "Fila em
-- tabela própria").
--
-- Só `service_role` chama: a rota que processa a fila já é o único ponto
-- autorizado a instanciar esse client (mesmo raciocínio do webhook de
-- pagamento).

create function public.claim_pending_email_messages(p_limit integer)
returns setof public.email_messages
language sql
security definer
set search_path = ''
as $$
  update public.email_messages
  set status = 'enviando'
  where id in (
    select id
    from public.email_messages
    where status = 'pendente' and next_attempt_at <= now()
    order by next_attempt_at
    limit p_limit
    for update skip locked
  )
  returning *;
$$;

revoke execute on function public.claim_pending_email_messages(integer) from public;
grant execute on function public.claim_pending_email_messages(integer) to service_role;
