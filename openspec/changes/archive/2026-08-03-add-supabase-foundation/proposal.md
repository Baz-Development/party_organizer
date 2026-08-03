## Why

Hoje o produto tem 14 telas prontas mas nenhum dado real: tudo vem de
`src/lib/mock-data.ts` e as rotas em `src/app/api/**` devolvem `persisted: false`.
Nada do que um convidado ou cliente faz sobrevive a um reload. Antes de construir
qualquer módulo (RSVP, presentes, galeria, cardápio, amigo secreto) é preciso ter
a base: banco com identidade e permissões corretas, ambientes reprodutíveis e
configuração 100% chaveada por `.env`, para que local, staging e produção sejam o
mesmo código apontando para projetos Supabase diferentes.

## What Changes

- Introduz o Supabase como backend (Postgres + Auth + Storage), rodando local via
  Supabase CLI (`supabase start`) e promovido para staging e produção pelo mesmo
  conjunto de migrations versionadas.
- Toda configuração passa a vir de variáveis de ambiente validadas em boot
  (`src/lib/env.ts`). Nenhuma URL, chave ou project-ref fica no código.
- Cria o schema núcleo: `profiles`, `organizations`, `organization_members`,
  `events`, `event_modules`, `schedule_items` — com RLS habilitada em todas.
- Adiciona autenticação por magic link (Supabase Auth) para cliente, organização e
  admin. O convidado permanece **sem conta**: acessa `/e/[slug]` publicamente.
- Introduz os clientes tipados do Supabase para os três contextos do App Router:
  Server Component, Route Handler e browser — mais um cliente `service-role`
  restrito ao servidor.
- Substitui os mocks das rotas `GET /api/eventos`, `GET /api/eventos/[slug]` e
  `GET /api/organizacoes` por leitura real do banco, preservando o formato de
  resposta atual descrito em `src/lib/types.ts`.
- Converte `src/lib/mock-data.ts` em seed do banco local, para que
  `marina-e-thiago`, `15-anos-sofia`, `aniversario-do-bento` e
  `convencao-nexus-2026` continuem funcionando em desenvolvimento.
- **BREAKING**: `src/lib/mock-data.ts` deixa de ser importado por páginas e rotas.
  Telas de módulos ainda não migrados (presentes, galeria, cardápio, amigo secreto)
  passam a importar o mock a partir de um arquivo de fixtures explícito até que
  seus changes sejam aplicados.

## Capabilities

### New Capabilities

- `infra-supabase`: ambientes local/staging/produção, migrations versionadas, seed,
  variáveis de ambiente validadas e promoção entre ambientes.
- `autenticacao`: login por magic link, sessão no App Router, perfis de usuário,
  papéis (cliente, organização, admin) e acesso público do convidado.
- `organizacoes`: organizações parceiras, membros, planos e escopo multi-tenant.
- `eventos`: criação e publicação de eventos, slug público, módulos habilitados,
  cronograma e tema de cor.

### Modified Capabilities

Nenhuma — não existem specs em `openspec/specs/` ainda; este é o primeiro change.

## Impact

- **Novas dependências**: `@supabase/supabase-js`, `@supabase/ssr`; Supabase CLI e
  Docker Desktop como pré-requisitos de desenvolvimento.
- **Novos arquivos**: `supabase/` (config, migrations, seed), `src/lib/env.ts`,
  `src/lib/supabase/{server,client,admin}.ts`, `src/lib/db/` (queries),
  `src/lib/database.types.ts` (gerado), `.env.example`.
- **Rotas afetadas**: `/api/eventos`, `/api/eventos/[slug]`, `/api/organizacoes`;
  novas rotas de sessão (`/api/auth/callback`, `/api/auth/sair`).
- **Telas afetadas**: `/painel`, `/painel/editor`, `/organizacao`, `/admin` passam a
  exigir sessão; `/onboarding` passa a criar organização e evento de verdade;
  `/e/[slug]` passa a ler do banco e retornar 404 real para slug inexistente.
- **Contrato preservado**: os tipos em `src/lib/types.ts` continuam sendo a forma
  das respostas — o banco usa `snake_case` e a camada de acesso mapeia para
  `camelCase`.
- **Riscos**: um erro de RLS vaza dados entre organizações; mitigado por testes de
  política e por nunca usar a chave `service-role` fora do servidor.
