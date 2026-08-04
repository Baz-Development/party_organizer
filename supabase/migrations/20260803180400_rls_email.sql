-- RLS da fila de e-mail e das supressões.
--
-- Nenhuma das duas tabelas tem grant de `insert` para `anon`/`authenticated`:
-- todo enfileiramento passa pelo client `service_role`, de dentro de rotas
-- server-only (design.md, decisão "Quem enfileira: TypeScript, não a função
-- SQL que originou a ação"). O único caminho de escrita sem conta é a função
-- `security definer` `unsubscribe_email`
-- (`20260803180700_email_suppression_functions.sql`), que não é bloqueada
-- pela RLS que ela mesma atravessa.

alter table public.email_messages enable row level security;
alter table public.email_suppressions enable row level security;

create policy email_messages_manage_read on public.email_messages
for select to authenticated
using (public.can_manage_event(event_id));

create policy email_suppressions_manage on public.email_suppressions
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

grant select on public.email_messages to authenticated;
grant select, insert, delete on public.email_suppressions to authenticated;

-- `grant all on all tables in schema public to service_role` da fundação só
-- alcança tabela que já existia quando rodou; as 2 tabelas deste change
-- precisam do grant de novo.
grant all on public.email_messages, public.email_suppressions to service_role;
