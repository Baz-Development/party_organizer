-- Evento: a entidade central. Nasce em rascunho e só vira público ao ser
-- publicado.

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  -- Único na plataforma inteira: a URL pública é /e/[slug], sem prefixo de
  -- organização.
  slug            text not null unique,
  organization_id uuid references public.organizations (id) on delete set null,
  host_profile_id uuid not null references public.profiles (id),
  kind            public.event_kind not null,
  title           text not null,
  event_at        timestamptz not null,
  venue           text,
  city            text,
  hosts           text,
  eyebrow         text,
  welcome         text,
  theme_key       public.theme_key not null default 'terracota',
  status          public.event_status not null default 'rascunho',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Listagens dos painéis: "meus eventos" e "eventos da organização".
create index events_host_idx on public.events (host_profile_id);
create index events_organization_idx on public.events (organization_id);

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_touch_updated_at
before update on public.events
for each row
execute function public.touch_updated_at();
