-- Vocabulário fechado do domínio.
--
-- Enums em vez de texto livre: habilitar um módulo inexistente ou salvar um
-- tema fora do conjunto vira erro do banco, sem validação duplicada na
-- aplicação. Crescer um enum exige migration (`alter type ... add value`),
-- que é o preço aceito por essa garantia.

create type public.user_role as enum ('cliente', 'organizacao', 'admin');

create type public.event_kind as enum (
  'casamento',
  'debutante',
  'infantil',
  'corporativo',
  'formatura'
);

create type public.event_status as enum ('rascunho', 'publicado', 'encerrado');

create type public.theme_key as enum ('oliva', 'terracota', 'marinho', 'dourado');

create type public.org_plan as enum ('parceiro', 'premium', 'enterprise');

create type public.org_member_role as enum ('proprietario', 'colaborador');

create type public.module_id as enum (
  'rsvp',
  'cronograma',
  'local',
  'presentes',
  'galeria',
  'mural',
  'cardapio',
  'amigo-secreto'
);
