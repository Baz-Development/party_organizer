-- RLS de organizações: isolamento entre organizações é a garantia mais crítica
-- da plataforma. Uma listagem sem filtro devolve apenas as organizações do
-- próprio usuário, independentemente do que a rota pedir.

alter table public.organizations enable row level security;

create policy organizations_select on public.organizations
for select to authenticated
using (public.is_org_member(id) or public.is_platform_admin());

-- Cadastro de organização parceira é ato comercial: só admin da plataforma.
create policy organizations_insert on public.organizations
for insert to authenticated
with check (public.is_platform_admin());

create policy organizations_update on public.organizations
for update to authenticated
using (public.is_org_owner(id) or public.is_platform_admin())
with check (public.is_org_owner(id) or public.is_platform_admin());

create policy organizations_delete on public.organizations
for delete to authenticated
using (public.is_platform_admin());

alter table public.organization_members enable row level security;

create policy organization_members_select on public.organization_members
for select to authenticated
using (public.is_org_member(organization_id) or public.is_platform_admin());

create policy organization_members_insert on public.organization_members
for insert to authenticated
with check (public.is_org_owner(organization_id) or public.is_platform_admin());

create policy organization_members_update on public.organization_members
for update to authenticated
using (public.is_org_owner(organization_id) or public.is_platform_admin())
with check (public.is_org_owner(organization_id) or public.is_platform_admin());

create policy organization_members_delete on public.organization_members
for delete to authenticated
using (public.is_org_owner(organization_id) or public.is_platform_admin());
