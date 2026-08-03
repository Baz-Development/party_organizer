-- Buckets do módulo de mídia. Os dois são privados: toda leitura passa por
-- URL assinada emitida pelo servidor depois de checar visibilidade do evento
-- e estado de moderação do item (ver design.md de add-media-storage-backend).
--
-- Limite de tipo e tamanho ficam no bucket, não só na aplicação: o Storage
-- recusa o upload antes de gravar qualquer byte.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'event-media',
    'event-media',
    false,
    10485760, -- 10 MiB — capa em resolução alta, um arquivo por evento por vez.
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'guest-uploads',
    'guest-uploads',
    false,
    8388608, -- 8 MiB — foto de celular de convidado, sem exagero.
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  );
