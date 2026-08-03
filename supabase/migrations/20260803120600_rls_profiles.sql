-- RLS de profiles: cada um enxerga e edita o próprio; admin enxerga todos.

alter table public.profiles enable row level security;

create policy profiles_select_self on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_platform_admin());

create policy profiles_update_self on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy profiles_update_admin on public.profiles
for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- Sem política de insert: o perfil só nasce pelo trigger on_auth_user_created,
-- que é `security definer` e não passa pela RLS.

-- Uma política de update não consegue proteger uma coluna específica — ela
-- autoriza a linha inteira. Sem este trigger, `profiles_update_self` deixaria
-- qualquer usuário se promover a admin.
create function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     -- auth.uid() nulo = operação de servidor (seed, job administrativo com a
     -- chave service-role). Requisição de navegador sempre tem uid, e sem
     -- sessão nenhuma política de update se aplica.
     and (select auth.uid()) is not null
     and not public.is_platform_admin()
  then
    raise exception
      'Somente um admin da plataforma pode alterar o papel de um perfil'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_role
before update on public.profiles
for each row
execute function public.prevent_role_escalation();
