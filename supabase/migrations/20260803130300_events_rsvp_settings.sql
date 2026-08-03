-- Configuração de RSVP do evento: prazo opcional e lista aberta.

alter table public.events
  add column rsvp_deadline   timestamptz,
  add column guest_list_open boolean not null default false;

-- Prazo no passado (relativo à criação do evento) é rejeitado na origem, não
-- só na validação da rota — evita que uma segunda via de escrita (script,
-- admin direto) grave um prazo que já nasce vencido.
alter table public.events
  add constraint events_rsvp_deadline_not_past
  check (rsvp_deadline is null or rsvp_deadline >= created_at);
