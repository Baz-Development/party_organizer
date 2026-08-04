-- Supressão de endereço por evento: retorno permanente do provedor ou
-- descadastro. `unique (event_id, email)` — um endereço só tem um motivo de
-- supressão ativo por evento; suprimir de novo pelo outro motivo apenas
-- atualizaria a mesma linha (tratado na função de descadastro e no
-- processador da fila).

create table public.email_suppressions (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  email      text not null,
  reason     public.email_suppression_reason not null,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);

create index email_suppressions_event_idx on public.email_suppressions (event_id);
