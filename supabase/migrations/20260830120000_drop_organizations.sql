-- Remove o conceito de organização parceira do MVP Villa Glam.
--
-- A ata define só dois públicos autenticados: a Equipe Villa Glam (`admin`) e o
-- Anfitrião (`cliente`). O papel `organizacao`, as tabelas `organizations` /
-- `organization_members`, o vínculo `events.organization_id` e todo ramo
-- `is_org_*` das políticas saem aqui.
--
-- Ordem obrigatória: primeiro recriar `can_manage_event` e as políticas de
-- `events` sem `is_org_*`, só depois dropar as funções e as tabelas.

-- ---------------------------------------------------------------------------
-- Enum user_role: Postgres não remove valor de enum, então o tipo é recriado.
-- ---------------------------------------------------------------------------

update public.profiles set role = 'cliente' where role = 'organizacao';

alter type public.user_role rename to user_role__old;
create type public.user_role as enum ('cliente', 'admin');
alter table public.profiles
  alter column role drop default,
  alter column role type public.user_role using role::text::public.user_role,
  alter column role set default 'cliente';
drop type public.user_role__old;

-- ---------------------------------------------------------------------------
-- Autorização de evento: "anfitrião OU admin", sem vínculo com organização.
-- ---------------------------------------------------------------------------

create or replace function public.can_manage_event(event uuid)
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
        or public.is_platform_admin()
      )
  );
$$;

drop policy events_manage_read on public.events;
create policy events_manage_read on public.events
for select to authenticated
using (
  host_profile_id = (select auth.uid())
  or public.is_platform_admin()
);

drop policy events_insert on public.events;
create policy events_insert on public.events
for insert to authenticated
with check (
  host_profile_id = (select auth.uid())
  or public.is_platform_admin()
);

drop policy events_update on public.events;
create policy events_update on public.events
for update to authenticated
using (public.can_manage_event(id))
with check (public.can_manage_event(id));

-- events_organization_idx é dropado junto com a coluna.
alter table public.events drop column organization_id;

-- ---------------------------------------------------------------------------
-- Funções, tabelas e tipos de organização.
-- ---------------------------------------------------------------------------

-- As políticas e o trigger `organization_members_keep_owner` caem junto com as
-- tabelas.
drop table if exists public.organization_members;
drop table if exists public.organizations;

drop function if exists public.is_org_member(uuid);
drop function if exists public.is_org_owner(uuid);
drop function if exists public.ensure_org_has_owner();

drop type if exists public.org_plan;
drop type if exists public.org_member_role;
