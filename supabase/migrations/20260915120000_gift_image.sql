-- Foto do presente. Guarda só o path no bucket `event-media` ("{event_id}/{uuid}.{ext}");
-- a leitura segue a policy `event_media_read` (evento publicado ou quem administra)
-- e o servidor emite a URL assinada na listagem.
alter table public.gifts add column image_path text;
