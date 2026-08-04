-- Fila e histórico de mensagens transacionais.
--
-- `data` (jsonb) guarda só os campos que formam a mensagem (nome do evento,
-- nome do destinatário, valor, etc.) — nunca o token de convite nem a URL de
-- revelação. O segredo que forma o link é resolvido na hora de renderizar o
-- modelo, dentro do processador da fila, e não é persistido em nenhum lugar
-- (design.md, decisão "Modelos como funções puras").
--
-- `(status, next_attempt_at)`: índice que o processador usa para reivindicar
-- o próximo lote a enviar (`claim_pending_email_messages`).

create table public.email_messages (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references public.events (id) on delete cascade,
  recipient_email     text not null,
  template            public.email_template not null,
  data                jsonb not null default '{}'::jsonb,
  status              public.email_status not null default 'pendente',
  attempts            integer not null default 0,
  next_attempt_at     timestamptz not null default now(),
  last_error          text,
  provider_message_id text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index email_messages_claim_idx on public.email_messages (status, next_attempt_at);
create index email_messages_event_idx on public.email_messages (event_id);

create trigger email_messages_touch_updated_at
before update on public.email_messages
for each row
execute function public.touch_updated_at();
