-- Conteúdo que pende do evento: módulos habilitados e cronograma.

create table public.event_modules (
  event_id uuid not null references public.events (id) on delete cascade,
  module   public.module_id not null,
  primary key (event_id, module)
);

create table public.schedule_items (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  -- Ordem definida pelo anfitrião. O unique garante que duas consultas
  -- devolvam o cronograma na mesma ordem.
  position    int not null,
  time        text not null,
  title       text not null,
  description text,
  unique (event_id, position)
);
