-- Histórico bruto de cada notificação de pagamento recebida, válida ou não —
-- "Requirement: Rastro de auditoria dos pagamentos" exige guardar o payload
-- bruto, e "Requirement: Confirmação exclusivamente por webhook assinado"
-- exige registrar o descarte de assinatura inválida para auditoria.
--
-- `unique (provider, provider_event_id)` é a chave de deduplicação de
-- "Requirement: Idempotência do processamento de notificações": a segunda
-- entrega do mesmo evento colide aqui antes de qualquer efeito colateral.
-- Eventos com assinatura inválida costumam não ter `provider_event_id`
-- confiável — ficam de fora da deduplicação (NULL não colide consigo mesmo em
-- unique constraint), o que é aceitável porque eles nunca chegam a mudar
-- estado (`process_payment_event` nunca é chamada para eles).

create table public.payment_events (
  id                uuid primary key default gen_random_uuid(),
  payment_id        uuid references public.payments (id) on delete set null,
  provider          text not null,
  provider_event_id text,
  event_type        text not null,
  payload           jsonb not null,
  signature_valid   boolean not null,
  received_at       timestamptz not null default now(),
  processed_at      timestamptz,
  unique (provider, provider_event_id)
);

create index payment_events_payment_idx on public.payment_events (payment_id);
