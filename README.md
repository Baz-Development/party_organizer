# Convite — organizador de festas

Protótipo visual das 14 telas do projeto Claude Design
(`af466763-6cc2-4746-9103-6226934b80a5`), portado para Next.js.

Eventos, perfis e cronograma vivem no Supabase (Postgres + Auth),
com RLS em todas as tabelas. Os módulos ainda não migrados (presentes, galeria,
mural, cardápio, amigo secreto) continuam lendo fixtures em `src/lib/fixtures/`
até que cada um ganhe seu próprio change.

## Rodando

Pré-requisitos: **Node 20+**, **Docker Desktop rodando** e **make**.

```bash
make dev
```

Um comando faz tudo: instala dependências, sobe o Supabase local, gera o
`.env.local` a partir das chaves do próprio CLI, aplica as migrations pendentes
e abre a aplicação em `http://localhost:3000`.

É seguro repetir — `make dev` não apaga dados. Na primeira execução ele baixa as
imagens dos contêineres, o que leva alguns minutos.

Abra **`/rotas`** para um índice navegável de todas as telas.

| Comando | O que faz |
| --- | --- |
| `make dev` | Sobe tudo e roda a aplicação |
| `make setup` | Primeira execução: instala, sobe o banco e carrega o seed |
| `make reset` | Recria o banco — migrations + seed. **Apaga os dados locais** |
| `make seed` | Regenera `supabase/seed.sql` dos mocks e carrega |
| `make types` | Regenera `src/lib/database.types.ts` a partir do schema |
| `make test` | Testes de política de RLS e de sessão |
| `make verify` | Lint + tipos + build + testes (o que o CI roda) |
| `make studio` / `make mail` | Abre o Studio / a caixa de e-mail local |
| `make stop` | Derruba os contêineres, preservando os dados |
| `make clean` | Derruba **e apaga** os dados do banco local |
| `make help` | Lista os alvos |

Cada alvo é um atalho para o script npm equivalente (`npm run db:reset`,
`npm test`, …), então quem não tem `make` pode seguir pelos scripts do
`package.json` — só precisará montar o `.env.local` na mão, copiando de
`.env.example` as chaves que `npm run db:start` imprime.

Sem Docker, aponte o `.env.local` para um projeto Supabase de staging pessoal —
o código é o mesmo, só mudam as variáveis.

### Portas do ambiente local

| Serviço | URL |
| --- | --- |
| API (Supabase) | `http://127.0.0.1:54421` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54422/postgres` |
| Studio | `http://127.0.0.1:54423` |
| Caixa de e-mail | `http://127.0.0.1:54424` |

Os links mágicos enviados em desenvolvimento **não saem da máquina**: abra a
caixa de e-mail local em `54424` para clicar no link.

> As portas saem da faixa `544xx` em vez da `543xx` padrão do Supabase CLI para
> não conflitar com outro projeto Supabase rodando na mesma máquina. Elas vivem
> em `supabase/config.toml`.

### Comandos de banco

| Comando | O que faz |
| --- | --- |
| `npm run db:start` / `db:stop` | Sobe / derruba o ambiente local |
| `npm run db:reset` | Recria o banco: migrations em ordem + seed |
| `npm run db:migrate` | Aplica as migrations pendentes |
| `npm run db:seed` | Regenera `supabase/seed.sql` dos mocks e carrega |
| `npm run db:types` | Regenera `src/lib/database.types.ts` do schema |
| `npm run db:diff` | Falha se o schema divergir das migrations |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase

## Telas

### Público (convidado)

| Rota | Tela |
| --- | --- |
| `/` | Landing Page |
| `/e/[slug]` | Página do Evento |
| `/e/[slug]/rsvp` | Fluxo RSVP (3 passos) |
| `/e/[slug]/presentes` | Lista de Presentes → checkout → sucesso |
| `/e/[slug]/galeria` | Galeria e Mural (com estado vazio) |
| `/e/[slug]/cardapio` | Votação de Cardápio |
| `/e/[slug]/amigo-secreto` | Amigo Secreto — Cadastro |
| `/e/[slug]/amigo-secreto/revelacao` | Amigo Secreto — Revelação |

### Cliente

| Rota | Tela |
| --- | --- |
| `/onboarding` | "Sua página está sendo preparada" (informativa) |
| `/painel` | Painel do Cliente |
| `/painel/convidados` | Gestão de Convidados |
| `/painel/editor` | Editor da Página |
| `/sem-acesso` | Conta autenticada sem provisionamento e sem evento |

### Plataforma

| Rota | Tela |
| --- | --- |
| `/admin` | Painel Admin |
| `/admin/clientes` | Contas de cliente — cadastrar (convite) e listar |
| `/admin/paginas` | Criar página de evento e atribuir o anfitrião |

Slugs de exemplo carregados pelo seed: `marina-e-thiago`, `15-anos-sofia`,
`aniversario-do-bento`, `convencao-nexus-2026`.

`/painel`, `/painel/*`, `/onboarding` e `/admin/*` exigem sessão.
Entre em `/entrar` com um dos e-mails do seed — `admin@exemplo.local` para o
painel administrativo, `marina-e-thiago@exemplo.local` para o de cliente — e
abra o link mágico na caixa de e-mail local (`http://127.0.0.1:54424`).

### Fluxo de acesso do cliente

A criação de evento **não** é self-service. A Equipe Villa Glam (`admin`):

1. cadastra a conta do cliente em `/admin/clientes` (nome + e-mail) — isso
   dispara um convite por e-mail e o perfil nasce já provisionado;
2. cria a página do evento em `/admin/paginas`, escolhendo a conta anfitriã;
3. o cliente abre o link de acesso, cai em `/painel` e passa a editar o
   conteúdo, o cronograma, a capa e a moderação da galeria e do mural.

Um e-mail que autentica sem ter sido provisionado e sem ser anfitrião de nenhum
evento cai em `/sem-acesso` — a sessão existe, mas nenhum painel se abre.

## Rotas de API

| Método | Rota | |
| --- | --- | --- |
| GET | `/api/eventos` | do banco, escopado por RLS |
| POST | `/api/eventos` | cria a página — só admin, anfitrião no corpo |
| GET · POST | `/api/admin/clientes` | lista / cadastra (convite) contas de cliente — só admin |
| GET | `/api/eventos/[slug]` | do banco, 404 real |
| GET · POST | `/api/eventos/[slug]/convidados` | evento real, convidados de fixture |
| GET | `/api/eventos/[slug]/presentes` | evento real, presentes de fixture |
| GET | `/api/auth/callback` | troca o link mágico por sessão |
| POST | `/api/auth/sair` | encerra a sessão |

`POST /api/eventos/[slug]/convidados` ainda devolve `persisted: false` — o RSVP
chega no change `add-guests-rsvp-backend`.

As páginas de servidor **não** passam por estas rotas: chamam `src/lib/db/`
direto. As rotas existem para consumo externo e para Client Components.

## Estrutura

```
src/
  proxy.ts                   Renova a sessão (o antigo middleware)
  app/
    page.tsx                 Landing
    entrar/                  Login por link mágico
    rotas/                   Índice de todas as telas
    onboarding/              Tela informativa "página em preparação"
    sem-acesso/              Conta autenticada sem acesso a painel
    painel/                  layout + visão geral, convidados, editor
    admin/                   Guarda o papel de admin + clientes, paginas
    e/[slug]/                Páginas públicas do evento
    api/                     Route handlers (eventos, sessão)
  components/
    ui.tsx                   Button, Input, Sheet, Badge, Toggle, Stepper...
    ImageSlot.tsx            Placeholder de foto (equivale ao <image-slot>)
    GuestShell.tsx           Moldura das telas do convidado
    PanelNav.tsx  Countdown.tsx  SairButton.tsx
  lib/
    env.ts  env.public.ts    Variáveis validadas (servidor / navegador)
    supabase/                Clients: server, client, admin (service-role)
    auth/                    Guardas de rota e validação de redirect
    db/                      Acesso a dados — único lugar com snake_case
    validation/              Schemas Zod das rotas de escrita
    fixtures/                O que ainda é mock (ver fixtures/README.md)
    database.types.ts        Gerado do schema por `npm run db:types`
    mock-data.ts             Fonte do seed — não importar em páginas
    types.ts  themes.ts  format.ts  slug.ts  use-now.ts

supabase/
  migrations/                Única fonte de verdade do schema
  seed.sql                   Gerado a partir de mock-data.ts
scripts/db/                  start, reset, types, diff, seed
tests/                       Políticas de RLS e fluxo de sessão
```

## Design system

Tokens em `src/app/globals.css` (`--paper`, `--ink`, `--accent`, …), expostos ao
Tailwind via `@theme inline` — daí vêm `bg-paper`, `text-ink-soft`, `bg-accent`.

O tema de cor é por evento: `themeVars(event.themeKey)` sobrescreve `--accent`
numa subárvore, então a mesma página muda de cor conforme o evento. Quatro temas
em `src/lib/themes.ts`: terracota, oliva, marinho e dourado.

Tipografia: Playfair Display (títulos), Inter (texto), Cormorant Garamond
(usada pelo tema "Romântico" do editor).

## Ambientes

Três projetos Supabase, **um único código**. O que muda entre eles é só o
conjunto de variáveis de ambiente.

| Ambiente | Projeto | Origem das variáveis |
| --- | --- | --- |
| local | Supabase CLI em Docker | `.env.local`, a partir de `.env.example` |
| staging | projeto na nuvem | variáveis do provedor de deploy |
| produção | projeto na nuvem | variáveis do provedor de deploy |

Nenhum arquivo `.env` é versionado além de `.env.example`. Toda variável é
validada em tempo de import: `src/lib/env.public.ts` (navegador) e
`src/lib/env.ts` (servidor, `server-only`). Falta uma variável, a aplicação não
sobe — e o erro diz qual.

`SUPABASE_SERVICE_ROLE_KEY` ignora a RLS e é lida **somente** por
`src/lib/supabase/admin.ts`. Qualquer import novo desse módulo pede revisão.

### Promoção: local → staging → produção

1. A mudança de schema nasce como migration local:
   `npx supabase migration new <nome>`, ou `npx supabase db diff -f <nome>`
   para capturar o que foi feito no Studio local.
2. `npm run db:reset` prova que a migration aplica em banco vazio, em ordem.
3. Staging: `npx supabase link --project-ref <ref-staging>` e
   `npx supabase db push`.
4. `npm run db:diff -- --linked` confirma que não sobrou divergência. O
   pipeline roda esse comando e interrompe o deploy se ele falhar.
5. Produção: mesmo par de comandos, com o ref de produção.

> **Nenhuma alteração de schema é feita pelo painel do Supabase.** Migrations
> versionadas são a única fonte de verdade — RLS, funções e triggers incluídos.
> O que for alterado direto no painel de staging ou produção não é válido, será
> apontado por `npm run db:diff` e sobrescrito na promoção seguinte.

### O que ainda precisa ser configurado fora do repositório

O pipeline em `.github/workflows/ci.yml` já roda lint, tipos, build e os testes
de política a cada push, e bloqueia o merge quando o schema remoto diverge das
migrations. Para o passo de divergência funcionar, faltam credenciais que só
quem tem a conta do Supabase pode criar:

1. Criar os projetos de **staging** e **produção** no Supabase.
2. Registrar como secrets do repositório: `SUPABASE_ACCESS_TOKEN`,
   `SUPABASE_STAGING_PROJECT_REF` e `SUPABASE_STAGING_DB_PASSWORD`.
3. No provedor de deploy, definir por ambiente as seis variáveis do
   `.env.example`, com `APP_ENV=staging` e `APP_ENV=production`.
4. No painel de cada projeto Supabase, em **Authentication → URL
   Configuration**, apontar *Site URL* para o `NEXT_PUBLIC_SITE_URL` daquele
   ambiente e adicionar `<NEXT_PUBLIC_SITE_URL>/api/auth/callback` às *Redirect
   URLs*. Sem isso o link mágico volta para o lugar errado.
5. Aplicar as migrations em staging a partir do zero
   (`npx supabase link --project-ref <ref>` e `npx supabase db push`) e
   confirmar com `npm run db:diff -- --linked`.

Os refs de projeto **não** entram no repositório — são configuração de
ambiente, como todo o resto.

## Verificação

```bash
npm run verify   # lint + tipos + build + testes
```

Os testes de política (`tests/rls.test.mjs`) falam com o banco local
autenticados como cliente A, cliente B e admin, e afirmam que leitura e escrita
cruzadas entre clientes são negadas. Exigem
`npm run db:start`. `tests/auth.test.mjs` percorre o link mágico de ponta a
ponta e é pulado se a aplicação não estiver rodando.

Os tipos em `src/lib/types.ts` são o contrato das respostas de API. O banco usa
`snake_case`; a conversão para `camelCase` acontece só em `src/lib/db/`.
