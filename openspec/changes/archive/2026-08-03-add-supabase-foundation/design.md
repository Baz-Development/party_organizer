## Context

O app é Next.js 16 (App Router) com 14 telas prontas e zero persistência: tudo vem
de `src/lib/mock-data.ts` e as rotas de API devolvem `persisted: false`. Os tipos de
domínio já existem em `src/lib/types.ts` e são o contrato que a camada de dados
precisa continuar honrando.

Este change monta a base sobre a qual os seis changes de módulo (convidados/RSVP,
presentes/pagamentos, mídia, cardápio, amigo secreto, e-mails) serão construídos.
Ele decide banco, identidade, autorização, forma de configurar ambientes e o padrão
de acesso a dados. Cada decisão aqui é herdada por todos os módulos.

## Goals / Non-Goals

**Goals:**

- Um ambiente Supabase local subindo com um comando, idêntico em schema a staging e
  produção.
- Configuração 100% por `.env`: o mesmo build roda em qualquer ambiente.
- Schema núcleo (perfis, organizações, membros, eventos, módulos, cronograma) com
  RLS habilitada em toda tabela, desde a primeira migration.
- Autenticação por magic link para cliente, organização e admin; convidado sem conta.
- Camada de acesso a dados tipada, com mapeamento `snake_case` ⇄ `camelCase`, que os
  módulos seguintes reutilizam.
- As telas hoje existentes continuam funcionando ao final do change.

**Non-Goals:**

- Tabelas e regras dos módulos: convidados, presentes, fotos, mural, cardápio,
  amigo secreto — cada um tem seu próprio change.
- Storage de imagens, pagamento e envio de e-mails transacionais (changes próprios;
  aqui só se garante que a infra e o `.env` comportem esses módulos).
- Realtime, cache/ISR, observabilidade e billing dos planos.
- Migração de dados de produção — não existe produção ainda.

## Decisions

### Supabase em vez de Postgres puro + camada própria

O produto precisa de banco, autenticação, storage de imagens e políticas de acesso
por linha. Supabase entrega os quatro com um CLI que sobe tudo local em Docker e
promove por migrations SQL versionadas. A alternativa (Postgres gerenciado + auth
próprio + S3) custaria semanas antes da primeira tela real funcionar.

Consequência aceita: acoplamento ao Supabase na camada de auth e storage. Mitigação:
todo acesso a dados passa por `src/lib/db/`, então trocar o provedor de banco não
espalha por páginas e rotas.

### Ambientes: três projetos, um código

| Ambiente | Projeto Supabase | Origem do `.env` |
| --- | --- | --- |
| local | Supabase CLI em Docker (`supabase start`) | `.env.local` a partir de `.env.example` |
| staging | projeto na nuvem, ref próprio | variáveis do provedor de deploy |
| produção | projeto na nuvem, ref próprio | variáveis do provedor de deploy |

Nenhum arquivo `.env` versionado além de `.env.example`. O `.gitignore` já ignora
`.env*` — apenas `.env.example` recebe exceção explícita.

Variáveis introduzidas:

```
# Cliente (expostas ao navegador)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=            # origem usada no redirect do magic link

# Servidor (nunca expostas)
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=                 # usado por migrations/seed, não pela aplicação

# Meta
APP_ENV=local|staging|production
```

`src/lib/env.ts` valida esse conjunto com um schema em tempo de import e lança erro
nomeando a variável faltante. Um arquivo separado para as variáveis públicas evita
que qualquer import de servidor arraste segredo para o bundle do cliente.

Regra de segurança: `SUPABASE_SERVICE_ROLE_KEY` só pode ser lida em
`src/lib/supabase/admin.ts`, e esse módulo carrega `import "server-only"`, o que
transforma um import acidental de Client Component em erro de build.

### Autorização por RLS, não por checagem em código

Toda tabela nasce com `enable row level security` e políticas explícitas. As rotas
usam o cliente com a sessão do usuário, de modo que o banco é a última linha de
defesa: uma rota esquecida ou um bug de filtro não vaza dados de outra organização.

O cliente `service-role` (que ignora RLS) fica restrito a: seed, jobs administrativos
e operações que precisam agir sem sessão — por exemplo, resolver um token de convite
de convidado. Cada uso é justificado no código.

Funções auxiliares em SQL, marcadas `security definer` e `stable`, evitam recursão de
política e são reutilizadas por todos os módulos:

```sql
-- É admin da plataforma?
create function public.is_platform_admin() returns boolean ...

-- Usuário atual pertence à organização?
create function public.is_org_member(org uuid) returns boolean ...

-- Usuário atual pode administrar este evento (anfitrião, org ou admin)?
create function public.can_manage_event(event uuid) returns boolean ...

-- Evento está publicado (visível ao convidado)?
create function public.is_event_public(event uuid) returns boolean ...
```

`can_manage_event` e `is_event_public` são o vocabulário que os changes de módulo
usarão nas políticas de suas tabelas, em vez de reescrever a lógica de posse.

### Schema núcleo

```sql
create type user_role   as enum ('cliente','organizacao','admin');
create type event_kind  as enum ('casamento','debutante','infantil','corporativo','formatura');
create type event_status as enum ('rascunho','publicado','encerrado');
create type theme_key   as enum ('oliva','terracota','marinho','dourado');
create type org_plan    as enum ('parceiro','premium','enterprise');
create type org_member_role as enum ('proprietario','colaborador');
create type module_id   as enum ('rsvp','cronograma','local','presentes','galeria',
                                 'mural','cardapio','amigo-secreto');

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  display_name text,
  role        user_role not null default 'cliente',
  created_at  timestamptz not null default now()
);

create table organizations (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  city      text,
  plan      org_plan not null default 'parceiro',
  contact   text,
  since     date not null default current_date,
  created_at timestamptz not null default now()
);

create table organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id      uuid not null references profiles(id) on delete cascade,
  role            org_member_role not null default 'colaborador',
  created_at      timestamptz not null default now(),
  primary key (organization_id, profile_id)
);

create table events (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  organization_id uuid references organizations(id) on delete set null,
  host_profile_id uuid not null references profiles(id),
  kind            event_kind not null,
  title           text not null,
  event_at        timestamptz not null,
  venue           text,
  city            text,
  hosts           text,
  eyebrow         text,
  welcome         text,
  theme_key       theme_key not null default 'terracota',
  status          event_status not null default 'rascunho',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table event_modules (
  event_id uuid not null references events(id) on delete cascade,
  module   module_id not null,
  primary key (event_id, module)
);

create table schedule_items (
  id       uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  position int  not null,
  time     text not null,
  title    text not null,
  description text,
  unique (event_id, position)
);
```

Notas:

- `module_id` como enum: habilitar um módulo desconhecido vira erro do banco, sem
  precisar de validação duplicada — atende ao cenário "Somente módulos conhecidos".
- `schedule_items.position` com unique garante ordenação estável entre consultas.
- `events.slug` único na plataforma inteira, porque a URL pública é `/e/[slug]` sem
  prefixo de organização.
- `contact` da organização e `email` do perfil ficam em texto simples; não há PII
  sensível além de e-mail nesta fase.

Políticas representativas:

```sql
-- events: leitura pública apenas do que está publicado
create policy events_public_read on events for select
  using (status = 'publicado');

-- events: quem administra vê em qualquer estado
create policy events_manage_read on events for select
  using (public.can_manage_event(id));

create policy events_insert on events for insert
  with check (host_profile_id = auth.uid());

create policy events_update on events for update
  using (public.can_manage_event(id))
  with check (public.can_manage_event(id));

-- profiles: cada um lê e edita o próprio; admin lê todos
create policy profiles_self on profiles for select
  using (id = auth.uid() or public.is_platform_admin());
create policy profiles_update_self on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
```

Escalada de privilégio: `profiles.role` é protegido por um trigger `before update`
que rejeita mudança de `role` quando o autor da transação não é admin — política de
update sozinha não consegue proteger coluna específica.

### Autenticação e sessão no App Router

`@supabase/ssr` com três construtores distintos:

| Módulo | Contexto | Chave |
| --- | --- | --- |
| `src/lib/supabase/server.ts` | Server Components, Route Handlers, Server Actions | anon + cookies da sessão |
| `src/lib/supabase/client.ts` | Client Components | anon |
| `src/lib/supabase/admin.ts` | apenas servidor, `import "server-only"` | service-role |

Fluxo do magic link: `/entrar` dispara o e-mail → o link volta em
`/api/auth/callback`, que troca o código por sessão e grava os cookies → redirect
para o destino guardado no parâmetro `next`, validado como caminho relativo do
próprio site para não virar open redirect.

Proteção das rotas: o middleware só renova a sessão. A decisão de acesso fica em
layouts de servidor (`/painel`, `/organizacao`, `/admin`), que leem o perfil e
redirecionam — assim a checagem nunca depende de o middleware ter rodado, e a RLS
segura o que escapar.

Convidado: nenhuma sessão. O link `/e/[slug]?convite=<token>` carrega um token
opaco; resolvê-lo exige o cliente `service-role` no servidor, porque o convidado
não tem identidade no banco. A tabela de tokens em si pertence ao change
`add-guests-rsvp-backend`; a fundação apenas fixa o padrão.

### Camada de acesso a dados

`src/lib/db/<entidade>.ts` exporta funções (`listEvents`, `getEventBySlug`,
`createEvent`, …) que recebem um client Supabase e devolvem os tipos de
`src/lib/types.ts`. O mapeamento `snake_case` → `camelCase` acontece nessas funções
e em nenhum outro lugar.

Páginas de servidor chamam `src/lib/db/` diretamente; as rotas em `src/app/api/`
existem para consumo externo e para os Client Components, e chamam as mesmas
funções. Não há `fetch` de página para a própria API — seria um salto de rede
desnecessário no App Router.

Validação de entrada com Zod nas rotas que escrevem, antes de tocar o banco, para
que o erro 400 seja específico em vez de virar erro de constraint.

### Estratégia de migração dos mocks

1. `supabase/seed.sql` é gerado a partir de `src/lib/mock-data.ts`, preservando os
   quatro slugs de exemplo. O gerador é um script versionado — a lógica de conversão
   fica auditável, não é um dump colado à mão.
2. As rotas do núcleo (`/api/eventos`, `/api/eventos/[slug]`, `/api/organizacoes`)
   passam a ler do banco.
3. Módulos ainda não migrados continuam lendo mocks, movidos de `mock-data.ts` para
   `src/lib/fixtures/` com um comentário apontando o change que os removerá. Isso
   deixa explícito, no código, o que ainda é falso.

## Risks / Trade-offs

**Política de RLS mal escrita vaza dados entre organizações.** É o risco mais grave
do change. Mitigação: uma suíte de testes de política roda contra o banco local
autenticando como usuários de organizações diferentes e afirma negação de leitura e
escrita cruzadas; ela roda em CI antes de qualquer deploy.

**`service-role` usada por conveniência.** Cada uso adicional derruba a garantia da
RLS. Mitigação: `import "server-only"`, um único módulo exportando esse client, e
revisão obrigatória de qualquer novo import dele.

**Docker como pré-requisito de desenvolvimento.** Quem não conseguir rodar Docker
fica sem ambiente local. Mitigação aceita: documentar no README e permitir apontar o
`.env.local` para um projeto de staging pessoal.

**Enum de módulos exige migration para crescer.** Adicionar um módulo novo vira
`alter type`. Trade-off aceito: a validação automática no banco vale mais do que a
flexibilidade de uma coluna texto, dado que o conjunto de módulos é do produto e
muda raramente.

**Divergência entre `src/lib/types.ts` e o schema.** Os tipos gerados do banco e os
tipos de domínio são dois artefatos. Mitigação: as funções de `src/lib/db/` declaram
o tipo de retorno de domínio explicitamente, então qualquer divergência aparece na
verificação de tipos, não em produção.

**Trigger de proteção de `role` é ponto único de falha.** Se removido, qualquer
usuário pode se tornar admin. Mitigação: teste dedicado no conjunto de testes de
política.
