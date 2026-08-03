-- RLS do conteúdo que pende do evento.
--
-- Módulos e cronograma herdam a visibilidade do evento: público quando o
-- evento está publicado, editável por quem administra o evento. Este é o
-- padrão que os changes de módulo devem repetir nas suas tabelas.

alter table public.event_modules enable row level security;

create policy event_modules_read on public.event_modules
for select to anon, authenticated
using (public.is_event_public(event_id) or public.can_manage_event(event_id));

create policy event_modules_insert on public.event_modules
for insert to authenticated
with check (public.can_manage_event(event_id));

create policy event_modules_delete on public.event_modules
for delete to authenticated
using (public.can_manage_event(event_id));

alter table public.schedule_items enable row level security;

create policy schedule_items_read on public.schedule_items
for select to anon, authenticated
using (public.is_event_public(event_id) or public.can_manage_event(event_id));

create policy schedule_items_insert on public.schedule_items
for insert to authenticated
with check (public.can_manage_event(event_id));

create policy schedule_items_update on public.schedule_items
for update to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy schedule_items_delete on public.schedule_items
for delete to authenticated
using (public.can_manage_event(event_id));
