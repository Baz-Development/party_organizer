-- Configuração de mídia do evento: política de moderação e capa.
--
-- Ficam como colunas de `events` (não numa tabela à parte) porque são 1:1
-- com o evento e já cabem no mesmo update que o editor faz.

alter table public.events
  add column moderation_policy public.moderation_policy not null default 'previa',
  add column cover_path text;

comment on column public.events.cover_path is
  'Path do objeto no bucket event-media, prefixado por "{event_id}/". Validado na camada de dados (setEventCover), não aqui.';
