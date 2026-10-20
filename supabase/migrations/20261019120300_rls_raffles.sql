-- RLS dos sorteios.
--
-- Tudo aqui é só de quem administra o evento — o convidado não lê nem
-- escreve nada destas tabelas (o módulo não tem tela pública).
--
-- `raffle_results` não tem policy de escrita: resultado só nasce dentro de
-- `draw_raffle_winner` e só muda por `mark_raffle_result_absent`/
-- `reset_raffle`, para a anfitriã não conseguir "escolher" um vencedor pela
-- API. Pela mesma razão, `raffles.status`/`locked_at`/`finished_at` ficam
-- fora do grant de update.

alter table public.raffles enable row level security;
alter table public.raffle_prizes enable row level security;
alter table public.raffle_participants enable row level security;
alter table public.raffle_results enable row level security;

create policy raffles_manage on public.raffles
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy raffle_prizes_manage on public.raffle_prizes
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy raffle_participants_manage on public.raffle_participants
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy raffle_results_manage_read on public.raffle_results
for select to authenticated
using (public.can_manage_event(event_id));

grant select, delete on public.raffles to authenticated;
grant insert (event_id, title, description, alternates_count) on public.raffles to authenticated;
grant update (title, description, alternates_count) on public.raffles to authenticated;

grant select, insert, update, delete on public.raffle_prizes to authenticated;
grant select, insert, delete on public.raffle_participants to authenticated;
grant select on public.raffle_results to authenticated;

-- Tabela criada depois de `20260803121100_grants.sql` precisa do grant de novo.
grant all on
  public.raffles,
  public.raffle_prizes,
  public.raffle_participants,
  public.raffle_results
to service_role;
