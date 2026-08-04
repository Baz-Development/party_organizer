-- Descadastro sem conta: quem recebeu uma mensagem usa o link de
-- descadastro, que chama esta função com o evento e o próprio e-mail — não
-- precisa do token de convidado, porque descadastro é por endereço, não por
-- pessoa identificada (`email_suppressions` não referencia `guests`).
--
-- `on conflict do nothing`: descadastrar duas vezes o mesmo endereço no
-- mesmo evento é idempotente, não erro.

create function public.unsubscribe_email(p_event_id uuid, p_email text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.email_suppressions (event_id, email, reason)
  values (p_event_id, lower(trim(p_email)), 'descadastro')
  on conflict (event_id, email) do nothing;
$$;

grant execute on function public.unsubscribe_email(uuid, text) to anon, authenticated;
