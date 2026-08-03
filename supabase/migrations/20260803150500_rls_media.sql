-- RLS de galeria, mural, curtidas e dos dois buckets de Storage.
--
-- Escrita do convidado sem conta passa pelas funções `security definer` de
-- `20260803140400_media_functions.sql`, não por política de `insert` aqui —
-- por isso não há `insert` para `anon`/`authenticated` em `photos`/
-- `mural_messages`/`reactions`.

alter table public.photos enable row level security;
alter table public.mural_messages enable row level security;
alter table public.reactions enable row level security;

-- Público só lê o aprovado de evento publicado; quem administra lê tudo,
-- inclusive pendente e oculto (fila de moderação).
create policy photos_public_read on public.photos
for select to anon, authenticated
using (status = 'aprovada' and public.is_event_public(event_id));

create policy photos_manage_read on public.photos
for select to authenticated
using (public.can_manage_event(event_id));

create policy photos_manage_write on public.photos
for update to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy photos_manage_delete on public.photos
for delete to authenticated
using (public.can_manage_event(event_id));

create policy mural_messages_public_read on public.mural_messages
for select to anon, authenticated
using (status = 'aprovada' and public.is_event_public(event_id));

create policy mural_messages_manage_read on public.mural_messages
for select to authenticated
using (public.can_manage_event(event_id));

create policy mural_messages_manage_write on public.mural_messages
for update to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy mural_messages_manage_delete on public.mural_messages
for delete to authenticated
using (public.can_manage_event(event_id));

-- `reactions` não tem leitura direta: a contagem já vive em `likes_count` nas
-- tabelas dono, e a curtida em si só é gravada por `react_to_item`. Só quem
-- administra pode inspecionar as linhas cruas (auditoria/depuração).
create policy reactions_manage_read on public.reactions
for select to authenticated
using (public.can_manage_event(event_id));

grant select on public.photos, public.mural_messages to anon, authenticated;
grant update, delete on public.photos, public.mural_messages to authenticated;
grant select on public.reactions to authenticated;

-- `grant all on all tables in schema public to service_role` da fundação só
-- alcança tabelas que já existiam quando rodou; tabela criada depois precisa
-- do grant de novo (mesmo achado de add-guests-rsvp-backend).
grant all on public.photos, public.mural_messages, public.reactions to service_role;

-- Storage -------------------------------------------------------------

-- `event-media`: capa curada por quem administra. Path é
-- "{event_id}/{uuid}.{ext}" — o primeiro segmento do path é o evento.
create policy event_media_read on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'event-media'
  and (
    public.is_event_public(((storage.foldername(name))[1])::uuid)
    or public.can_manage_event(((storage.foldername(name))[1])::uuid)
  )
);

create policy event_media_manage on storage.objects
for all to authenticated
using (
  bucket_id = 'event-media'
  and public.can_manage_event(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'event-media'
  and public.can_manage_event(((storage.foldername(name))[1])::uuid)
);

-- `guest-uploads`: só o servidor grava (URL assinada emitida com a chave
-- service-role, que ignora RLS) — de propósito não há política de `insert`
-- para `anon`/`authenticated` aqui, o que é o que impede um convidado de
-- escrever direto no bucket sem passar pela validação da aplicação.
--
-- Leitura: pública quando a foto já está aprovada; quem administra o evento
-- lê mesmo pendente/oculta (fila de moderação usa a mesma URL assinada).
create policy guest_uploads_read on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'guest-uploads'
  and exists (
    select 1 from public.photos p
    where p.storage_path = storage.objects.name
      and (p.status = 'aprovada' or public.can_manage_event(p.event_id))
  )
);

-- Quem administra pode remover o arquivo ao excluir a foto.
create policy guest_uploads_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'guest-uploads'
  and public.can_manage_event(((storage.foldername(name))[1])::uuid)
);
