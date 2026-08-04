-- Participantes do amigo secreto de um evento. Vinculado ao convidado (não
-- ao guest_invites diretamente) porque a revelação por e-mail futura
-- (`add-transactional-emails`) precisa do e-mail que já mora em `guests`.
--
-- `wishlist` não mora aqui: vive em `secret_santa_wishlists`
-- (`20260803170050_secret_santa_wishlists.sql`), tabela sem nenhuma policy de
-- select para anon/authenticated. RLS é por linha, não por coluna — se a
-- wishlist estivesse nesta tabela, a policy de gestão do anfitrião (que
-- precisa ler `display_name`/`joined_at` para a lista de participantes)
-- também exporia a lista de desejos de todo mundo, furando "lista visível
-- apenas a quem tirou".

create table public.secret_santa_participants (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  guest_id     uuid not null references public.guests (id) on delete cascade,
  display_name text not null,
  joined_at    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (event_id, guest_id)
);

create index secret_santa_participants_event_idx on public.secret_santa_participants (event_id);

create trigger secret_santa_participants_touch_updated_at
before update on public.secret_santa_participants
for each row
execute function public.touch_updated_at();
