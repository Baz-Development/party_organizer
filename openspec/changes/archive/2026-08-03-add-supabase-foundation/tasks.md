## 1. Ambiente local e configuração por `.env`

- [x] 1.1 Instalar o Supabase CLI como devDependency e rodar `supabase init`, gerando `supabase/config.toml`
- [x] 1.2 Subir o ambiente local (`supabase start`) e registrar no README os pré-requisitos (Docker) e as portas/credenciais locais
- [x] 1.3 Criar `.env.example` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` e `APP_ENV`, com placeholders
- [x] 1.4 Adicionar `!.env.example` ao `.gitignore` (o padrão `.env*` atual o ignoraria)
- [x] 1.5 Criar `src/lib/env.ts` (variáveis de servidor, com `import "server-only"`) e `src/lib/env.public.ts` (variáveis do cliente), ambos validando com Zod e lançando erro que nomeia a variável faltante
- [x] 1.6 Adicionar scripts ao `package.json`: `db:start`, `db:stop`, `db:reset`, `db:migrate`, `db:seed`, `db:types`, `db:diff`
- [x] 1.7 Documentar no README o fluxo local→staging→produção e a regra de que nenhuma alteração de schema é feita pelo painel do Supabase

## 2. Migration do schema núcleo

- [x] 2.1 Migration com os enums `user_role`, `event_kind`, `event_status`, `theme_key`, `org_plan`, `org_member_role`, `module_id`
- [x] 2.2 Migration com `profiles` e trigger que cria o perfil ao inserir em `auth.users`
- [x] 2.3 Migration com `organizations` e `organization_members`, incluindo constraint que impede remover o último proprietário
- [x] 2.4 Migration com `events` (slug único, anfitrião, organização opcional, status, tema) e trigger de `updated_at`
- [x] 2.5 Migration com `event_modules` e `schedule_items` (unique de `(event_id, position)`)
- [x] 2.6 Rodar `db:reset` e confirmar que todas as migrations aplicam em ordem em banco vazio

## 3. Autorização (RLS)

- [x] 3.1 Migration com as funções `security definer`: `is_platform_admin`, `is_org_member`, `can_manage_event`, `is_event_public`
- [x] 3.2 Habilitar RLS e escrever políticas de `profiles` (leitura/edição do próprio, admin lê todos)
- [x] 3.3 Trigger `before update` em `profiles` que rejeita alteração de `role` por quem não é admin
- [x] 3.4 Habilitar RLS e escrever políticas de `organizations` e `organization_members` (isolamento entre organizações; só admin cria organização; só proprietário gerencia membros)
- [x] 3.5 Habilitar RLS e escrever políticas de `events` (leitura pública só de publicado; gestão por anfitrião, organização e admin)
- [x] 3.6 Habilitar RLS e escrever políticas de `event_modules` e `schedule_items`, herdando a visibilidade do evento
- [x] 3.7 Revisar tabela por tabela que nenhuma ficou sem `enable row level security` — automatizado na migration `20260803121000_assert_rls_enabled.sql`

## 4. Autenticação no App Router

- [x] 4.1 Instalar `@supabase/supabase-js` e `@supabase/ssr`
- [x] 4.2 Criar `src/lib/supabase/server.ts` (sessão via cookies) e `src/lib/supabase/client.ts`
- [x] 4.3 Criar `src/lib/supabase/admin.ts` com `import "server-only"`, único ponto que lê a chave `service-role`
- [x] 4.4 Criar a tela `/entrar` que dispara o magic link e confirma o envio com a mesma mensagem para e-mail existente ou não
- [x] 4.5 Criar `/api/auth/callback` que troca o código por sessão e redireciona para o parâmetro `next`, validado como caminho relativo do próprio site
- [x] 4.6 Criar `/api/auth/sair` que invalida a sessão no servidor e limpa os cookies
- [x] 4.7 Adicionar middleware que apenas renova a sessão, sem decidir autorização — em Next.js 16 o arquivo é `src/proxy.ts`
- [x] 4.8 Adicionar checagem de sessão e papel nos layouts de `/painel`, `/organizacao` e `/admin`, redirecionando para `/entrar?next=<rota>`
- [x] 4.9 Consultar `node_modules/next/dist/docs/` sobre cookies, middleware e redirect antes de escrever 4.2–4.8 (esta versão do Next.js tem breaking changes)

## 5. Camada de acesso a dados

- [x] 5.1 Gerar `src/lib/database.types.ts` via `db:types` e ligar ao script de verificação de tipos
- [x] 5.2 Criar `src/lib/db/mappers.ts` com a conversão `snake_case` ⇄ `camelCase` para os tipos de `src/lib/types.ts`
- [x] 5.3 Criar `src/lib/db/events.ts`: `listEvents`, `getEventBySlug`, `createEvent`, `updateEvent`, `setEventStatus`, `setEventModules`, `replaceSchedule`
- [x] 5.4 Criar `src/lib/db/organizations.ts`: `listOrganizations`, `getOrganization`, `createOrganization`, `addMember`, `removeMember`, com contagem de eventos totais e ativos
- [x] 5.5 Criar `src/lib/db/profiles.ts`: `getProfile`, `updateProfile`
- [x] 5.6 Criar `src/lib/validation/` com os schemas Zod de evento e organização usados pelas rotas de escrita
- [x] 5.7 Implementar a geração de slug a partir do título (minúsculas, sem acentos, hifens) com resolução de colisão por sufixo

## 6. Seed a partir dos mocks

- [x] 6.1 Escrever o script versionado que converte `src/lib/mock-data.ts` em `supabase/seed.sql`
- [x] 6.2 Gerar o seed com os quatro slugs de exemplo publicados, cada um com organização, cronograma e módulos coerentes com as telas atuais
- [x] 6.3 Fazer o script de seed recusar execução quando `APP_ENV=production`
- [x] 6.4 Rodar `db:reset` e navegar por `/e/marina-e-thiago` confirmando paridade visual com o estado mockado

## 7. Migração das rotas e telas do núcleo

- [x] 7.1 Reescrever `GET /api/eventos` lendo do banco, preservando o formato de resposta atual
- [x] 7.2 Reescrever `GET /api/eventos/[slug]` com 404 real para slug inexistente ou evento não publicado sem vínculo
- [x] 7.3 Reescrever `GET /api/organizacoes` lendo do banco, escopado por RLS — 401 sem sessão, já que organização não é dado público
- [x] 7.4 Ligar `/e/[slug]` e `/painel` às funções de `src/lib/db/` (sem `fetch` da página para a própria API)
- [x] 7.5 Ligar `/onboarding` à criação real de evento e, quando aplicável, de organização — passo de detalhes acrescentado, sem o qual não há título nem data para criar
- [x] 7.6 Ligar `/painel/editor` à persistência de conteúdo editorial, tema, módulos e cronograma
- [x] 7.7 Ligar `/organizacao` e `/admin` aos dados reais, com as métricas de eventos totais e ativos
- [x] 7.8 Mover os mocks ainda usados (presentes, galeria, mural, cardápio, amigo secreto) de `src/lib/mock-data.ts` para `src/lib/fixtures/`, comentando qual change removerá cada um

## 8. Testes e verificação

- [x] 8.1 Montar o harness de testes que autentica no banco local como cliente, membro de organização A, membro de organização B e admin
- [x] 8.2 Testes de RLS: leitura e escrita cruzadas entre organizações são negadas por qualquer rota
- [x] 8.3 Testes de RLS: evento em rascunho não é visível ao público; publicado é
- [x] 8.4 Teste de escalada de privilégio: usuário não consegue alterar o próprio `role` para admin
- [x] 8.5 Teste de que a chave `service-role` não aparece no bundle do cliente após `npm run build`
- [x] 8.6 Rodar `npm run lint`, a verificação de tipos e o build completo com o `.env.local` apontando ao Supabase local

## 9. Promoção de ambientes

- [ ] 9.1 Criar os projetos Supabase de staging e produção e registrar seus refs fora do repositório — **bloqueado**: exige a conta Supabase do time. Passos no README, seção "O que ainda precisa ser configurado fora do repositório".
- [ ] 9.2 Aplicar as migrations em staging a partir do zero e confirmar schema idêntico ao local — **bloqueado por 9.1**; comandos documentados no README
- [ ] 9.3 Configurar as variáveis de ambiente de staging e produção no provedor de deploy — **bloqueado**: exige acesso ao provedor de deploy
- [x] 9.4 Adicionar ao pipeline a etapa que roda `db:diff` e interrompe o deploy quando há divergência de schema — `.github/workflows/ci.yml`, job `schema-em-dia` (precisa dos secrets de 9.1)
- [ ] 9.5 Configurar as URLs de redirect do magic link por ambiente, a partir de `NEXT_PUBLIC_SITE_URL` — feito para o ambiente local em `supabase/config.toml`; staging e produção dependem de 9.1
