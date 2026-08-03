-- RLS de presentes e pagamentos, sobre `can_manage_event`/`is_event_public`
-- de `20260803120500_authorization_functions.sql`.
--
-- `gifts` não guarda identidade de comprador — é seguro expor a linha
-- inteira ao público de um evento publicado ("Requirement: Visibilidade do
-- estado do presente": convidado vê disponibilidade, não identidade).
-- `gift_reservations` e `payments` guardam `buyer_name`/`buyer_email` — só
-- quem administra o evento lê ("Requirement: Acesso restrito aos dados de
-- pagamento"). Nenhuma das duas tem grant de escrita para `anon`/
-- `authenticated`: toda escrita passa pelas funções `security definer` de
-- `..._gift_checkout_functions.sql` (criação) ou pelo client `service_role`
-- do webhook (confirmação/estorno) — mesmo raciocínio de
-- `20260803130500_rls_guests.sql` para o token de convite.

alter table public.gifts enable row level security;
alter table public.gift_reservations enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

create policy gifts_read_public on public.gifts
for select to anon, authenticated
using (public.is_event_public(event_id));

create policy gifts_manage on public.gifts
for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));

create policy gift_reservations_read on public.gift_reservations
for select to authenticated
using (public.can_manage_event(event_id));

create policy payments_read on public.payments
for select to authenticated
using (public.can_manage_event(event_id));

create policy payment_events_read on public.payment_events
for select to authenticated
using (
  exists (
    select 1 from public.payments p
    where p.id = payment_id and public.can_manage_event(p.event_id)
  )
);

grant select on public.gifts to anon, authenticated;
grant insert, update, delete on public.gifts to authenticated;

grant select on public.gift_reservations to authenticated;
grant select on public.payments to authenticated;
grant select on public.payment_events to authenticated;

-- `grant all on all tables in schema public to service_role` de
-- `20260803121100_grants.sql` só alcança as tabelas que já existiam quando
-- rodou; as 4 tabelas deste change precisam do grant de novo.
grant all on public.gifts, public.gift_reservations, public.payments, public.payment_events
  to service_role;
