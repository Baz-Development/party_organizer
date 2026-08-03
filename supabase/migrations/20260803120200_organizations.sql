-- Organizações parceiras (buffets, espaços, produtoras) e seus membros.

create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  city       text,
  plan       public.org_plan not null default 'parceiro',
  contact    text,
  since      date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  role            public.org_member_role not null default 'colaborador',
  created_at      timestamptz not null default now(),
  primary key (organization_id, profile_id)
);

-- Busca "de quais organizações este perfil participa?", feita a cada request
-- autenticado de organização.
create index organization_members_profile_idx
  on public.organization_members (profile_id);

-- Uma organização sem proprietário fica órfã: ninguém consegue gerenciar seus
-- membros de novo. O trigger é `deferrable initially deferred` para que trocar
-- de proprietário numa única transação (promove um, rebaixa o outro) funcione;
-- só o estado ao final do commit é checado.
create function public.ensure_org_has_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A organização inteira foi removida: não há composição a preservar.
  if not exists (
    select 1 from public.organizations o where o.id = old.organization_id
  ) then
    return null;
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = old.organization_id
      and m.role = 'proprietario'
  ) then
    raise exception
      'A organização % ficaria sem proprietário', old.organization_id
      using errcode = 'check_violation';
  end if;

  return null;
end;
$$;

create constraint trigger organization_members_keep_owner
after delete or update on public.organization_members
deferrable initially deferred
for each row
execute function public.ensure_org_has_owner();
