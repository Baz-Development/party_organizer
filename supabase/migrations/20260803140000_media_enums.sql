-- Vocabulário fechado do módulo de mídia (galeria e mural).

-- Política de moderação do evento: aprovação prévia (nasce pendente) ou
-- publicação imediata (nasce aprovada). Vive em `events` porque é
-- configuração 1:1 do evento, não um dado do módulo em si.
create type public.moderation_policy as enum ('previa', 'imediata');

-- Estado de um item de galeria/mural. Três estados, não um boolean: "oculta"
-- e "pendente" são situações diferentes — oculta é uma decisão deliberada
-- depois de já ter sido pública, pendente nunca chegou a ser pública.
create type public.photo_status as enum ('pendente', 'aprovada', 'oculta');
create type public.mural_status as enum ('pendente', 'aprovada', 'oculta');

-- Alvo de uma curtida. Uma tabela `reactions` para os dois tipos em vez de
-- `photo_id`/`mural_message_id` opcionais lado a lado.
create type public.reaction_target as enum ('foto', 'recado');
