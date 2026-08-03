-- Vocabulário do módulo de presentes e pagamentos. Mesmo raciocínio de
-- `20260803120000_enums.sql`: estado fechado em enum, não texto livre.

create type public.gift_status as enum ('disponivel', 'reservado', 'comprado');

-- Ciclo de vida de uma reserva de presente simples (não-cota).
create type public.reservation_status as enum (
  'ativa',
  'expirada',
  'concluida',
  'cancelada'
);

-- Ciclo de vida de um pagamento, do checkout ao reembolso.
create type public.payment_status as enum (
  'pendente',
  'pago',
  'falho',
  'reembolsado'
);
