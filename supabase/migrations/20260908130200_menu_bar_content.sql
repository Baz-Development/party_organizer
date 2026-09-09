-- Conteúdo das seções Cardápio e Bar da página do evento.
--
-- Mesmo padrão de `schedule_items` (20260803120400_event_content.sql): lista
-- ordenada pelo anfitrião, `position` com unique por evento para que duas
-- consultas devolvam na mesma ordem, RLS e grants herdando a visibilidade do
-- evento. O texto de serviço de bar e o drink de assinatura são campo único
-- por evento — vão para colunas de `events`, como o amigo secreto
-- (20260908120000_secret_santa_event_config.sql).

create table public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  position    int not null,
  -- Etapa da refeição (Entrada, Prato principal, Sobremesa, ...). Texto livre,
  -- como `menu_polls.course` era — o produto não fecha o vocabulário em enum.
  course      text not null,
  name        text not null,
  description text,
  unique (event_id, position)
);

create table public.bar_items (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  position    int not null,
  name        text not null,
  description text,
  unique (event_id, position)
);

alter table public.events
  add column bar_service        text,
  add column bar_signature_name text,
  add column bar_signature_desc text;

-- RLS: cópia do padrão de `schedule_items` (20260803120900_rls_event_content.sql).
alter table public.menu_items enable row level security;

create policy menu_items_read on public.menu_items
for select to anon, authenticated
using (public.is_event_public(event_id) or public.can_manage_event(event_id));

create policy menu_items_insert on public.menu_items
for insert to authenticated
with check (public.can_manage_event(event_id));

create policy menu_items_update on public.menu_items
for update to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy menu_items_delete on public.menu_items
for delete to authenticated
using (public.can_manage_event(event_id));

alter table public.bar_items enable row level security;

create policy bar_items_read on public.bar_items
for select to anon, authenticated
using (public.is_event_public(event_id) or public.can_manage_event(event_id));

create policy bar_items_insert on public.bar_items
for insert to authenticated
with check (public.can_manage_event(event_id));

create policy bar_items_update on public.bar_items
for update to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy bar_items_delete on public.bar_items
for delete to authenticated
using (public.can_manage_event(event_id));

-- Grants: cópia do bloco `schedule_items` (20260803121100_grants.sql).
grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant select on public.bar_items to anon, authenticated;
grant insert, update, delete on public.bar_items to authenticated;
