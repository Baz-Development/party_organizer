-- Vocabulário de autorização compartilhado por todas as políticas.
--
-- Todas são `security definer`: rodam como dono do schema e por isso não
-- disparam a RLS das tabelas que consultam. É o que evita recursão infinita
-- quando a política de uma tabela precisa consultar essa mesma tabela
-- (organization_members) ou a tabela dona (events).
--
-- `stable` permite ao planejador chamar a função uma vez por consulta em vez
-- de uma vez por linha.
--
-- Os changes de módulo (RSVP, presentes, galeria, …) devem escrever suas
-- políticas em cima destas funções, em vez de reimplementar posse.

-- É admin da plataforma?
create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

-- O usuário atual pertence a esta organização?
create function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select org is not null and exists (
    select 1
    from public.organization_members m
    where m.organization_id = org
      and m.profile_id = (select auth.uid())
  );
$$;

-- O usuário atual é proprietário desta organização? Só proprietário gerencia
-- a composição de membros.
create function public.is_org_owner(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select org is not null and exists (
    select 1
    from public.organization_members m
    where m.organization_id = org
      and m.profile_id = (select auth.uid())
      and m.role = 'proprietario'
  );
$$;

-- O usuário atual pode administrar este evento — como anfitrião, como membro
-- da organização dona, ou como admin da plataforma.
create function public.can_manage_event(event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    where e.id = event
      and (
        e.host_profile_id = (select auth.uid())
        or public.is_org_member(e.organization_id)
        or public.is_platform_admin()
      )
  );
$$;

-- O evento está publicado, isto é, visível ao convidado sem conta?
create function public.is_event_public(event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    where e.id = event
      and e.status = 'publicado'
  );
$$;

grant execute on function public.is_platform_admin() to anon, authenticated;
grant execute on function public.is_org_member(uuid) to anon, authenticated;
grant execute on function public.is_org_owner(uuid) to anon, authenticated;
grant execute on function public.can_manage_event(uuid) to anon, authenticated;
grant execute on function public.is_event_public(uuid) to anon, authenticated;
