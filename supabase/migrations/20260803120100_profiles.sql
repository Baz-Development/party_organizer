-- Perfil da plataforma, espelhando um usuário de auth.users.
--
-- A aplicação nunca lê auth.users diretamente: profiles é a identidade visível
-- do domínio e o alvo das foreign keys.

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text,
  role         public.user_role not null default 'cliente',
  created_at   timestamptz not null default now()
);

comment on column public.profiles.role is
  'Protegido pelo trigger profiles_protect_role: só admin da plataforma altera.';

-- O perfil nasce junto com o usuário, no primeiro login por link mágico.
-- `security definer` porque o insert acontece dentro da transação do GoTrue,
-- que não tem permissão sobre o schema public.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    )
  )
  -- Logins seguintes reutilizam o perfil existente.
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
