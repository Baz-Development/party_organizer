-- Token de convite: link público que identifica o convidado em `/e/[slug]`
-- sem exigir conta. Fica em tabela própria, sem política de leitura pública —
-- só as funções `security definer` do change o consultam.
--
-- `pgcrypto` fornece `gen_random_bytes`; declarada aqui, onde é usada, no
-- schema `extensions` (padrão Supabase). Chamada qualificada para não
-- depender do `search_path` em que a migration roda.

create extension if not exists pgcrypto with schema extensions;

create table public.guest_invites (
  id         uuid primary key default gen_random_uuid(),
  guest_id   uuid not null unique references public.guests (id) on delete cascade,
  -- 32 bytes de entropia, hex: 64 caracteres, URL-safe sem encoding extra.
  token      text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now()
);
