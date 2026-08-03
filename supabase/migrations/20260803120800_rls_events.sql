-- RLS de events.
--
-- Políticas de select são permissivas e se somam: um evento é legível se
-- estiver publicado OU se o usuário puder administrá-lo. Rascunho e encerrado
-- ficam invisíveis a quem não tem vínculo — inclusive para o convidado sem
-- conta, que chega como `anon`.

alter table public.events enable row level security;

create policy events_public_read on public.events
for select to anon, authenticated
using (status = 'publicado');

create policy events_manage_read on public.events
for select to authenticated
using (public.can_manage_event(id));

-- Quem cria é o anfitrião. Vincular o evento a uma organização exige pertencer
-- a ela: sem esta checagem, um usuário poderia despejar eventos no portfólio
-- de qualquer parceiro.
create policy events_insert on public.events
for insert to authenticated
with check (
  host_profile_id = (select auth.uid())
  and (
    organization_id is null
    or public.is_org_member(organization_id)
    or public.is_platform_admin()
  )
);

create policy events_update on public.events
for update to authenticated
using (public.can_manage_event(id))
with check (
  public.can_manage_event(id)
  and (
    organization_id is null
    or public.is_org_member(organization_id)
    or public.is_platform_admin()
  )
);

create policy events_delete on public.events
for delete to authenticated
using (public.can_manage_event(id));
