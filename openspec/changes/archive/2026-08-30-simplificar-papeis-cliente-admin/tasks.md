## 1. Migration — remoção de organizações

- [x] 1.1 Criar `supabase/migrations/<ts>_drop_organizations.sql`: migrar
      `profiles.role = 'organizacao'` para `'cliente'`; recriar o enum
      `user_role` como `('cliente','admin')`.
- [x] 1.2 Na mesma migration: recriar `can_manage_event` sem `is_org_member`;
      recriar `events_insert` e `events_update` sem o ramo de organização;
      `drop column events.organization_id` e o índice `events_organization_idx`.
- [x] 1.3 Na mesma migration: `drop` das políticas de `organizations` e
      `organization_members`, das funções `is_org_member` / `is_org_owner`, das
      tabelas e dos tipos `org_plan` / `org_member_role`.
- [x] 1.4 Rodar `npm run db:reset` e `npm run db:types`; conferir
      `npm run db:diff`. Migration aplica em banco vazio; `database.types.ts`
      regerado do schema local bate com a edição manual; `db:diff` = "No schema
      changes found". (Também: `scripts/db/diff.mjs` ajustado para ignorar a
      linha JSON de resumo dos CLIs recentes, que causava falso positivo.)

## 2. Seed

- [x] 2.1 Remover `organizations`, `organization_members` e o perfil de
      organização de `src/lib/mock-data.ts`.
- [x] 2.2 Ajustar eventos do mock que referenciavam `organizationId`.
- [x] 2.3 `npm run db:seed` e conferir. Seed carrega: 1 admin + 4 clientes
      (nenhum `organizacao`), 4 eventos com anfitrião, sem referência a
      organização.

## 3. Guards e acesso a dados

- [x] 3.1 Remover `requireOrganizationMember` e `SessaoDeOrganizacao` de
      `src/lib/auth/guards.ts`.
- [x] 3.2 Remover `listMembershipIds` de `src/lib/db/profiles.ts` e
      `src/lib/db/organizations.ts` inteiro.
- [x] 3.3 Remover o tipo `organizacao` do union de papéis em
      `src/lib/types.ts` e qualquer `Organization` / `OrganizationMember`.

## 4. Rotas e telas

- [x] 4.1 Remover `src/app/organizacao/**` e `src/app/api/organizacoes/**`.
- [x] 4.2 Remover a linha `/organizacao` de `src/app/rotas/page.tsx` e do
      README. Também: links mortos em `src/app/Landing.tsx` (seção "Parceiros",
      nav e rodapé) e cópia em `src/app/entrar/page.tsx`.
- [x] 4.3 `src/app/admin/AdminPanel.tsx` + `src/app/admin/page.tsx`: remover o
      bloco de organizações (listar contas de cliente e eventos).
- [x] 4.4 Ajustar `GET /api/eventos` para escopar só por anfitrião/admin
      (a rota já não filtrava por organização; ajuste de comentário +
      `ListEventsOptions.organizationId` removido de `src/lib/db/events.ts`).

## 5. Testes

- [x] 5.1 `tests/rls.test.mjs` + `tests/harness.mjs`: remover organizações;
      dois anfitriões (`membroA`/`membroB`, papel `cliente`) + admin. Ripple:
      `tests/secret-santa.test.mjs` e `tests/payments.test.mjs` (remoção de
      `organization_id`/ajuste de texto).
- [x] 5.2 `npm run verify` — lint + typecheck + build + testes: 144 testes,
      142 passam, 0 falhas, 2 pulados (testes e2e de auth que exigem a app no
      ar).

## 6. Documentação

- [x] 6.1 README: remover `/organizacao`, o e-mail de organização do seed e a
      menção a "organização parceira".
- [x] 6.2 `openspec/config.yaml`: atualizar o `context` para dois papéis.
- [x] 6.3 `openspec/ROADMAP.md`: nota sobre a remoção do módulo `organizacoes`.
