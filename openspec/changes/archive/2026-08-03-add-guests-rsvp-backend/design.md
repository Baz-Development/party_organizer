## Context

`add-supabase-foundation` já entrega `events`, `organizations`, `profiles`, os
enums, as funções de autorização (`can_manage_event`, `is_event_public`,
`is_org_member`, `is_platform_admin`) e a camada `src/lib/db/` no padrão que
este change segue (client recebido com a sessão de quem pediu; RLS escopa,
nunca a aplicação).

Hoje `GET/POST /api/eventos/[slug]/convidados` devolve fixtures de
`src/lib/fixtures/guests.ts` e `POST` responde `persisted: false`. O tipo
`Guest` já existe em `src/lib/types.ts` e é o contrato a preservar na resposta
da API — o mapeamento do schema do banco para esse tipo fica em
`src/lib/db/mappers.ts`, como já acontece para `EventSummary`.

O convidado nunca autentica: ele chega em `/e/[slug]` com um token de convite
na URL. Não existe sessão Supabase para ele, então RLS por `auth.uid()` não
serve para o caminho do convidado — precisa de um mecanismo próprio.

## Goals / Non-Goals

**Goals:**
- Persistir convidados, tokens de convite e respostas de RSVP.
- Garantir que o token de convite seja opaco, não enumerável e escopado a um
  evento — mesmo padrão de "nada revelado" que a fundação já aplica a eventos
  não publicados.
- Manter privacidade: só quem administra o evento lê a lista completa; o
  convidado só enxerga o próprio registro.
- Suportar lista aberta (RSVP sem token, cria convidado "não listado").
- Import/export em lote para quem administra.

**Non-Goals:**
- Envio de e-mail de convite ou confirmação — fica para
  `add-transactional-emails`, que consome os tokens gerados aqui.
- Amigo-secreto e enquete de cardápio — consomem esta base depois
  (`add-secret-santa-backend`, `add-menu-poll-backend`), fora de escopo aqui.
- Reenvio/rotação de token — fora de escopo; se um link vazar, o remédio hoje
  é remover e recriar o convidado (já coberto pelo requisito de remoção).

## Decisions

### Três tabelas: `guests`, `guest_invites`, `rsvp_responses`

- `guests` guarda o estado atual (o que a lista e as estatísticas leem).
- `guest_invites` isola o token: mantém a superfície de dados sensíveis
  (token) fora da tabela que quem administra lista e exporta o tempo todo, e
  deixa explícito que só uma função seguranca-definer deve lê-la.
- `rsvp_responses` é o histórico append-only de cada envio — não é
  estritamente pedido pelas specs, mas sem ele "resposta mais recente vale"
  não é auditável nem reconstruível se `guests` for corrigido manualmente.
  Alternativa descartada: só a tabela `guests` com um campo `responded_at` —
  mais simples, mas perde o histórico e dificulta debugar disputa de "eu
  respondi diferente" no futuro.

```sql
create table public.guests (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  name          text not null,
  group_name    text,
  email         text,
  phone         text,
  status        public.rsvp_status not null default 'pendente',
  companions    integer not null default 0 check (companions >= 0),
  kids          integer not null default 0 check (kids >= 0),
  dietary       text,
  unlisted      boolean not null default false,
  invited_at    timestamptz not null default now(),
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index guests_event_idx on public.guests (event_id);
create index guests_event_status_idx on public.guests (event_id, status);

-- Reaproveitamento de duplicata na importação em lote: mesmo nome + e-mail no
-- mesmo evento. E-mail é opcional, então o índice não pode ser único puro —
-- vira único parcial, restrito a quando o e-mail existe.
create unique index guests_event_name_email_idx
  on public.guests (event_id, lower(name), lower(email))
  where email is not null;

create trigger guests_touch_updated_at
before update on public.guests
for each row
execute function public.touch_updated_at();

create table public.guest_invites (
  id         uuid primary key default gen_random_uuid(),
  guest_id   uuid not null unique references public.guests (id) on delete cascade,
  -- 32 bytes de entropia, hex: 64 caracteres, URL-safe sem encoding extra.
  token      text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now()
);

create table public.rsvp_responses (
  id           uuid primary key default gen_random_uuid(),
  guest_id     uuid not null references public.guests (id) on delete cascade,
  event_id     uuid not null references public.events (id) on delete cascade,
  status       public.rsvp_status not null,
  companions   integer not null default 0 check (companions >= 0),
  kids         integer not null default 0 check (kids >= 0),
  dietary      text,
  responded_at timestamptz not null default now()
);

create index rsvp_responses_guest_idx on public.rsvp_responses (guest_id, responded_at desc);

alter table public.events
  add column rsvp_deadline timestamptz,
  add column guest_list_open boolean not null default false;
```

`public.rsvp_status` já existe (enum criado na fundação para o mock de
`Guest.status`) — reaproveitado aqui como tipo de coluna real; se ainda não
existir no enum da fundação, este change o cria.

### Acesso do convidado via função `security definer`, não via RLS de sessão

O convidado não tem `auth.uid()`. Duas opções:

1. Guardar o token numa claim customizada de uma sessão anônima e escrever
   políticas RLS em cima dela.
2. Expor funções `security definer` (mesmo padrão de
   `20260803120500_authorization_functions.sql`) que recebem o token como
   argumento, validam e retornam/gravam — a tabela em si fica fechada para
   `anon`/`authenticated` fora de quem administra o evento.

Fica com (2): é o padrão já estabelecido pela fundação para lógica que precisa
atravessar RLS de forma controlada, evita reimplementar sessão anônima, e
mantém o token fora de qualquer política de `select` — nenhuma política
"vaza" linha por engano porque não existe política de leitura direta para
convidado.

```sql
-- Identifica o convidado pelo token e devolve o que a página de RSVP precisa
-- para prefill. Não revela nada se o token não existir ou for de outro
-- evento (retorna null nos dois casos — indistinguível de propósito).
create function public.get_guest_by_invite_token(p_token text)
returns table (
  guest_id uuid,
  event_id uuid,
  name text,
  status public.rsvp_status,
  companions integer,
  kids integer,
  dietary text
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.event_id, g.name, g.status, g.companions, g.kids, g.dietary
  from public.guest_invites gi
  join public.guests g on g.id = gi.guest_id
  where gi.token = p_token;
$$;

-- Grava a resposta de um convidado identificado por token. Valida prazo e
-- módulo habilitado dentro da função para que a regra não dependa de o
-- chamador (rota Next.js) lembrar de checar.
create function public.submit_rsvp(
  p_token text,
  p_status public.rsvp_status,
  p_companions integer,
  p_kids integer,
  p_dietary text
)
returns public.guests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_event public.events;
begin
  select g.* into v_guest
  from public.guest_invites gi
  join public.guests g on g.id = gi.guest_id
  where gi.token = p_token;

  if not found then
    raise exception 'convite_invalido' using errcode = 'P0001';
  end if;

  select * into v_event from public.events e where e.id = v_guest.event_id;

  if not exists (
    select 1 from public.event_modules m
    where m.event_id = v_event.id and m.module = 'rsvp'
  ) then
    raise exception 'modulo_desabilitado' using errcode = 'P0001';
  end if;

  if v_event.rsvp_deadline is not null and now() > v_event.rsvp_deadline then
    raise exception 'prazo_encerrado' using errcode = 'P0001';
  end if;

  if p_status = 'recusado' then
    p_companions := 0;
    p_kids := 0;
  end if;

  update public.guests
  set status = p_status,
      companions = p_companions,
      kids = p_kids,
      dietary = p_dietary,
      responded_at = now()
  where id = v_guest.id
  returning * into v_guest;

  insert into public.rsvp_responses (guest_id, event_id, status, companions, kids, dietary)
  values (v_guest.id, v_guest.event_id, p_status, p_companions, p_kids, p_dietary);

  return v_guest;
end;
$$;

-- Lista aberta: cria o convidado "não listado" e já grava a primeira
-- resposta. Só aceita quando o evento está publicado e com lista aberta.
create function public.submit_open_rsvp(
  p_event_slug text,
  p_name text,
  p_status public.rsvp_status,
  p_companions integer,
  p_kids integer,
  p_dietary text
)
returns public.guests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_guest public.guests;
begin
  select * into v_event from public.events e where e.slug = p_event_slug;

  if not found or v_event.status <> 'publicado' or not v_event.guest_list_open then
    raise exception 'lista_fechada' using errcode = 'P0001';
  end if;

  if v_event.rsvp_deadline is not null and now() > v_event.rsvp_deadline then
    raise exception 'prazo_encerrado' using errcode = 'P0001';
  end if;

  if p_status = 'recusado' then
    p_companions := 0;
    p_kids := 0;
  end if;

  insert into public.guests (event_id, name, status, companions, kids, dietary, unlisted, responded_at)
  values (v_event.id, p_name, p_status, p_companions, p_kids, p_dietary, true, now())
  returning * into v_guest;

  insert into public.guest_invites (guest_id) values (v_guest.id);

  insert into public.rsvp_responses (guest_id, event_id, status, companions, kids, dietary)
  values (v_guest.id, v_event.id, p_status, p_companions, p_kids, p_dietary);

  return v_guest;
end;
$$;

grant execute on function public.get_guest_by_invite_token(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, public.rsvp_status, integer, integer, text) to anon, authenticated;
grant execute on function public.submit_open_rsvp(text, text, public.rsvp_status, integer, integer, text) to anon, authenticated;
```

`errcode = 'P0001'` com uma mensagem curta e estável (`convite_invalido`,
`modulo_desabilitado`, `prazo_encerrado`, `lista_fechada`) para a camada
`src/lib/db/errors.ts` mapear para os erros de domínio já existentes, sem
depender de parsear texto livre do Postgres.

### RLS: só quem administra lê/escreve as tabelas diretamente

```sql
alter table public.guests enable row level security;
alter table public.guest_invites enable row level security;
alter table public.rsvp_responses enable row level security;

create policy guests_manage on public.guests
  for all
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

create policy guest_invites_manage on public.guest_invites
  for all
  using (public.can_manage_event((select event_id from public.guests where id = guest_id)))
  with check (public.can_manage_event((select event_id from public.guests where id = guest_id)));

create policy rsvp_responses_read on public.rsvp_responses
  for select
  using (public.can_manage_event(event_id));
```

Nenhuma política de `select`/`insert` para `anon`/`authenticated` sem vínculo
— o caminho do convidado passa exclusivamente pelas funções acima, que rodam
como `security definer` e por isso não são bloqueadas pela RLS que elas
mesmas atravessam.

### Import em lote reaproveita, não duplica

O índice único parcial `(event_id, lower(name), lower(email)) where email is
not null` é o mecanismo de deduplicação do requisito "duplicata dentro do
evento". A função de importação faz `insert ... on conflict (...) do update`
quando o convidado já existe, preservando `id` (e portanto o token e o
histórico de resposta). Convidados sem e-mail nunca deduplicam por nome
sozinho — nome duplicado é comum (dois "Ana") e reaproveitar erradamente
apagaria RSVP de gente diferente.

### Camada `src/lib/db/guests.ts`

Segue o padrão de `src/lib/db/events.ts`: funções recebem o `client` da
sessão de quem pediu; RLS decide o que aparece. `listGuests`, `createGuest`,
`updateGuest`, `deleteGuest`, `importGuests`, `exportGuests` usam o client
autenticado normal (RLS de `guests_manage`). `getGuestByToken` e `submitRsvp`
chamam as RPCs acima via `client.rpc(...)` com o client anônimo do App
Router — nenhuma delas precisa de sessão.

## Risks / Trade-offs

- **[Risco] Token em texto plano em `guest_invites.token`** → aceitável: o
  token em si *é* a credencial pública (equivalente a uma senha de uso único
  na URL), não um segredo adicional sobre outro segredo. Mitigado por ficar
  numa tabela sem política de leitura pública e por ter 256 bits de entropia
  (não é fisicamente enumerável).
- **[Risco] Função `security definer` com lógica de negócio duplica a
  validação que também existe no Zod da rota Next.js** → aceita-se a
  duplicação: a validação na rota dá mensagem de erro amigável cedo; a da
  função é a garantia real (a rota pode ter bug, o banco não deve deixar
  passar). Mitigação: erros de domínio (`P0001` com código curto) mapeados
  uma vez em `src/lib/db/errors.ts`, não espalhados pelas rotas.
- **[Risco] Import em lote grande trava numa única transação** → fora de
  escopo tratar volume aqui (produto é festa, não evento de massa); se vier a
  doer, a mitigação é paginar o insert, não redesenhar o schema.
- **[Trade-off] `rsvp_responses` cresce sem limite e nunca é limpo** →
  aceitável no tamanho do produto; se precisar, é índice + retenção depois,
  não uma decisão a travar agora.

## Migration Plan

Migrations novas em `supabase/migrations/`, seguindo a numeração cronológica
já usada pela fundação (prefixo `<timestamp>_<descricao>.sql`):

1. `_guests.sql` — tabela `guests`, índices, trigger de `updated_at`.
2. `_guest_invites.sql` — tabela `guest_invites`.
3. `_rsvp_responses.sql` — tabela `rsvp_responses`.
4. `_events_rsvp_settings.sql` — `alter table events` (prazo, lista aberta).
5. `_guest_functions.sql` — as três funções `security definer` e seus
   `grant execute`.
6. `_rls_guests.sql` — `enable row level security` + políticas das três
   tabelas.

Sem dado a migrar (tabelas novas). Rollback é `drop` das tabelas/funções na
ordem inversa — seguro porque nada em produção ainda depende delas até este
change ser aplicado e as rotas trocadas.

## Open Questions

Nenhuma pendente — decisões suficientes para gerar as tasks.
