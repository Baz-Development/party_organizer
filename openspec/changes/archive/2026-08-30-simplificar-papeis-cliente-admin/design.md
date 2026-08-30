## Contexto

Três papéis (`cliente`, `organizacao`, `admin`) e duas tabelas de organização
atravessam a fundação. Removê-los toca o enum `user_role`, as funções de
autorização, a coluna `events.organization_id` e todas as políticas que
ramificam em `is_org_member`.

## Decisões

### Enum `user_role` recriado, não alterado

Postgres não remove valor de enum. A migration cria `user_role_new AS ENUM
('cliente','admin')`, migra qualquer `profiles.role = 'organizacao'` para
`'cliente'`, troca a coluna e dropa o tipo antigo.

```sql
-- <ts>_drop_organizations.sql
update public.profiles set role = 'cliente' where role = 'organizacao';

alter type public.user_role rename to user_role__old;
create type public.user_role as enum ('cliente', 'admin');
alter table public.profiles
  alter column role drop default,
  alter column role type public.user_role using role::text::public.user_role,
  alter column role set default 'cliente';
drop type public.user_role__old;

alter table public.events drop column organization_id;

drop policy events_insert on public.events;
create policy events_insert on public.events
for insert to authenticated
with check (host_profile_id = (select auth.uid()) or public.is_platform_admin());

drop policy events_update on public.events;
create policy events_update on public.events
for update to authenticated
using (public.can_manage_event(id))
with check (public.can_manage_event(id));

create or replace function public.can_manage_event(event uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.events e
    where e.id = event
      and (e.host_profile_id = (select auth.uid()) or public.is_platform_admin())
  );
$$;

drop function if exists public.is_org_member(uuid);
drop function if exists public.is_org_owner(uuid);
drop table if exists public.organization_members;
drop table if exists public.organizations;
drop type if exists public.org_plan;
drop type if exists public.org_member_role;
```

Ordem: primeiro recriar `can_manage_event` e as políticas de `events` sem
`is_org_*`, depois dropar as funções e as tabelas.

### Guards

`requireOrganizationMember` e `SessaoDeOrganizacao` saem de
`src/lib/auth/guards.ts`. `listMembershipIds` sai de `src/lib/db/profiles.ts`.
`requireAdmin` e `requireSession` ficam.

### Sem novas variáveis de ambiente.

## Migração de dados

Seed: remover `organizations` e `organization_members` de `src/lib/mock-data.ts`
e o e-mail `contato@santaclara.com.br`. Ambientes staging/produção: rodar o
`update ... set role = 'cliente'` antes do push (a migration já o inclui).
