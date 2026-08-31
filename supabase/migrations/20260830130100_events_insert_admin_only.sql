-- Criação de evento restrita ao admin.
--
-- Na ata Villa Glam a página do evento é montada pela Equipe Villa Glam, que
-- aponta a conta de cliente anfitriã no ato. O cliente continua administrando
-- o próprio evento (events_update / can_manage_event seguem iguais), mas não
-- cria mais nenhum — o self-service de `/onboarding` sai junto no código.

drop policy events_insert on public.events;

create policy events_insert on public.events
for insert to authenticated
with check (
  public.is_platform_admin()
  and exists (
    select 1 from public.profiles p
    where p.id = host_profile_id
      and p.role = 'cliente'
  )
);
