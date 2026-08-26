-- Corrige events_manage_read: `can_manage_event(id)` reconsulta a própria
-- tabela `events`. Numa política de select DA PRÓPRIA `events`, isso é uma
-- auto-referência que não enxerga a linha recém-criada dentro do mesmo
-- comando — todo `insert into events ... returning` (o que o PostgREST faz
-- sempre que o cliente encadeia `.select()`, como em criarEvento) violava a
-- RLS mesmo com host_profile_id correto.
--
-- A correção troca a política pela checagem direta nas colunas da própria
-- linha, sem reconsultar a tabela. `can_manage_event` continua correta e em
-- uso nas políticas de outras tabelas (event_modules, guests, etc.), que não
-- sofrem desse problema por não serem a própria `events`.

drop policy events_manage_read on public.events;

create policy events_manage_read on public.events
for select to authenticated
using (
  host_profile_id = (select auth.uid())
  or public.is_org_member(organization_id)
  or public.is_platform_admin()
);
