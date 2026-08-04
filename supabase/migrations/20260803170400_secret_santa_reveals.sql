-- Registro de quem já revelou seu par e quando. Sem policy de select para
-- ninguém além de `service_role` — mesmo motivo de
-- `secret_santa_assignments`: a existência de uma linha aqui não vaza o par
-- em si, mas ainda assim só a função `get_my_secret_santa` precisa lê-la.

create table public.secret_santa_reveals (
  assignment_id uuid primary key references public.secret_santa_assignments (id) on delete cascade,
  revealed_at   timestamptz not null default now()
);
