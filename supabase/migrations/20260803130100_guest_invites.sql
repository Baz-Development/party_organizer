-- Token de convite: link público que identifica o convidado em `/e/[slug]`
-- sem exigir conta. Fica em tabela própria, sem política de leitura pública —
-- só as funções `security definer` do change o consultam.

create table public.guest_invites (
  id         uuid primary key default gen_random_uuid(),
  guest_id   uuid not null unique references public.guests (id) on delete cascade,
  -- 32 bytes de entropia, hex: 64 caracteres, URL-safe sem encoding extra.
  token      text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now()
);
