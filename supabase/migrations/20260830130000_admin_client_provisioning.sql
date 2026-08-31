-- Provisionamento de contas de cliente pela Equipe Villa Glam (admin).
--
-- O perfil do cliente deixa de nascer só no self-service: o admin convida a
-- pessoa por e-mail (`auth.admin.inviteUserByEmail`), o que cria a linha em
-- `auth.users` já com `invited_at`. `handle_new_user` passa a carimbar
-- `profiles.provisioned` a partir desse sinal, para que um e-mail aleatório
-- que peça link mágico (sem convite e sem evento) não alcance nenhum painel.

alter table public.profiles
  add column provisioned boolean not null default false;

comment on column public.profiles.provisioned is
  'true quando a conta foi criada por convite do admin (auth.users.invited_at).';

-- Recria o trigger para herdar nome e marca de provisionamento do convite.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, provisioned)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    ),
    new.invited_at is not null
  )
  -- Logins seguintes reutilizam o perfil existente.
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Listagem de contas de cliente para o painel de admin.
--
-- A view junta `profiles` com `auth.users` (para a situação "aguardando
-- primeiro acesso" x "ativa") e conta os eventos em que a conta é anfitriã.
-- Roda como dono (security_invoker = off) porque `authenticated` não enxerga
-- `auth.users`; o acesso fica trancado atrás da função `security definer`.
-- ---------------------------------------------------------------------------

create view public.client_accounts
with (security_invoker = off) as
  select
    p.id,
    p.email,
    p.display_name,
    p.created_at,
    u.last_sign_in_at,
    (select count(*) from public.events e where e.host_profile_id = p.id) as event_count
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'cliente';

revoke all on public.client_accounts from anon, authenticated;

create function public.list_client_accounts()
returns setof public.client_accounts
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.client_accounts
  where public.is_platform_admin()
  order by created_at desc;
$$;

grant execute on function public.list_client_accounts() to authenticated;
