-- Vocabulário fechado da fila de e-mail transacional.

create type public.email_status as enum ('pendente', 'enviando', 'entregue', 'falha');

create type public.email_template as enum (
  'convite',
  'lembrete_rsvp',
  'confirmacao_rsvp',
  'recibo_presente',
  'revelacao_amigo_secreto',
  'acesso_painel'
);

create type public.email_suppression_reason as enum ('retorno_permanente', 'descadastro');
