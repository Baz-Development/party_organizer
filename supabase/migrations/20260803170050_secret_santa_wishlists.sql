-- Lista de desejos, em tabela própria e não em `secret_santa_participants`,
-- para que a policy de gestão do anfitrião (select de
-- id/display_name/joined_at, para a tela de administração) nunca alcance a
-- lista de desejos de ninguém. Só a função de revelação
-- (`get_my_secret_santa`, security definer) lê esta tabela, e só a linha de
-- quem o participante tirou.

create table public.secret_santa_wishlists (
  participant_id uuid primary key references public.secret_santa_participants (id) on delete cascade,
  items          text[] not null default '{}',
  updated_at     timestamptz not null default now()
);

create trigger secret_santa_wishlists_touch_updated_at
before update on public.secret_santa_wishlists
for each row
execute function public.touch_updated_at();
