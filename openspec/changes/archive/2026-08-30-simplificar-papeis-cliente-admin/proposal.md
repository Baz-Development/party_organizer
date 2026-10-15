## Why

A ata do projeto ALF Eventos (`docs/ATA DE REUNIÃO — PROJETO APP ALF EVENTOS.pdf`)
define apenas dois públicos autenticados: a **Equipe ALF Eventos** (que opera a
plataforma) e o **Anfitrião/contratante** (dono de um evento). O `convidado`
continua sem conta. Não há "organização parceira" no MVP.

Hoje o produto carrega um terceiro papel — `organizacao` — com painel próprio
(`/organizacao`), tabelas (`organizations`, `organization_members`), guard
(`requireOrganizationMember`) e ramos de autorização em toda política de RLS
(`is_org_member`, `is_org_owner`). Isso é superfície de código e de segurança
que o MVP não usa e que diverge da ata.

## What Changes

- **BREAKING**: o papel `organizacao` deixa de existir. Passam a existir dois
  papéis autenticados: `cliente` (anfitrião) e `admin` (Equipe ALF Eventos).
- A área `/organizacao` e o guard `requireOrganizationMember` são removidos.
- A autorização de evento deixa de considerar vínculo com organização:
  `can_manage_event` passa a ser "anfitrião OU admin".
- O evento deixa de ter vínculo opcional com organização.
- As tabelas `organizations` e `organization_members` e suas políticas são
  removidas por migration; a coluna `events.organization_id` é removida.
- O seed deixa de criar organizações e membros.

## Capabilities

### Modified Capabilities

- `autenticacao`: dois papéis autenticados em vez de três; remoção da área de
  organização da proteção de rotas.
- `eventos`: remoção do vínculo opcional com organização; publicação restrita a
  anfitrião ou admin.

### Removed Capabilities

- `organizacoes`: o conceito de organização parceira sai do produto no MVP.

## Impact

- **Depende de**: `add-supabase-foundation`.
- **Migrations novas**: `drop` de `organizations`, `organization_members`,
  `events.organization_id`, funções `is_org_member` / `is_org_owner`, ramos de
  organização em `can_manage_event` e nas políticas `events_insert` /
  `events_update`; `alter type user_role` para retirar `organizacao` (recriação
  do enum).
- **Código afetado**: `src/lib/auth/guards.ts`, `src/lib/auth/redirect.ts`,
  `src/lib/db/profiles.ts` (`listMembershipIds`), `src/lib/db/organizations.ts`
  (removido), `src/app/organizacao/**` (removido),
  `src/app/api/organizacoes/route.ts` (removido), `src/lib/types.ts`,
  `src/lib/mock-data.ts`, `src/app/rotas/page.tsx`.
- **Rotas afetadas**: `/organizacao` (removida), `GET /api/organizacoes`
  (removida), `GET /api/eventos` (deixa de escopar por organização).
- **Telas afetadas**: `/organizacao` (removida), `/admin` (deixa de listar
  organizações), `/rotas`.
- **Testes afetados**: `tests/rls.test.mjs` perde os atores "membro da
  organização A/B" e ganha asserção de que anfitrião != anfitrião continua
  isolado.
- **Riscos**: enum recriado exige recriar a coluna `profiles.role`; migração de
  dados de qualquer perfil `organizacao` existente para `cliente` antes do drop.
