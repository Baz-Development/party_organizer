## 1. Migrations

- [x] 1.1 Criar `supabase/migrations/<ts>_admin_client_listing.sql`: view
      `client_accounts` e função `list_client_accounts()` `security definer`
      protegida por `is_platform_admin()`.
- [x] 1.2 Criar `supabase/migrations/<ts>_events_insert_admin_only.sql`: recriar
      `events_insert` exigindo `is_platform_admin()` e `host_profile_id` de um
      perfil `cliente`.
- [x] 1.3 Rodar `npm run db:reset`, `npm run db:types`, `npm run db:diff`.

## 2. Provisionamento de cliente (server-only)

- [x] 2.1 `src/lib/supabase/admin.ts`: helper `inviteClient(email, displayName)`
      via `auth.admin.inviteUserByEmail`.
- [x] 2.2 `src/lib/validation/`: schema Zod de `{ email, displayName }`.
- [x] 2.3 `POST /api/admin/clientes`: guard `requireAdmin`, valida, chama
      `inviteClient`, trata conflito de e-mail.
- [x] 2.4 `GET /api/admin/clientes`: guard `requireAdmin`, retorna
      `list_client_accounts()` mapeada para camelCase.

## 3. Criação de página pelo admin

- [x] 3.1 `POST /api/eventos`: trocar guard para `requireAdmin`; aceitar
      `hostProfileId` no corpo; validar que o perfil é `cliente`.
- [x] 3.2 `src/lib/db/events.ts`: `createEvent` passa a receber `hostProfileId`
      explícito em vez de `auth.uid()`. (Já feito em `simplificar-papeis`.)
- [x] 3.3 Remover a criação de evento de `src/app/onboarding/OnboardingFlow.tsx`.

## 4. Guards e estados vazios

- [x] 4.1 `src/lib/auth/guards.ts`: `requireSession` recusa cliente sem eventos
      e sem provisionamento; nova tela `/sem-acesso`.
- [x] 4.2 `/onboarding`: tela informativa "página em preparação".
- [x] 4.3 `/painel` (`PainelOverview.tsx`): card de página em preparação quando
      não há eventos.

## 5. Painel de admin

- [x] 5.1 `src/app/admin/AdminPanel.tsx`: aba "Clientes" (listar + cadastrar) e
      aba "Páginas" (criar evento escolhendo o anfitrião numa combo de clientes).
      Implementado como rotas `/admin/clientes` e `/admin/paginas` no mesmo
      `PanelNav`, seguindo o padrão de `/painel`.
- [x] 5.2 Client Components de formulário chamando as rotas de `/api/admin/*`.

## 6. Seed e testes

- [x] 6.1 `src/lib/mock-data.ts`: marcar os clientes do seed como provisionados
      pelo admin `admin@exemplo.local`; garantir que cada evento tem
      `host_profile_id` de um cliente do seed. (Feito em `scripts/db/generate-seed.mjs`,
      que é a fonte do seed; `provisioned = true` para todo perfil `cliente`.)
- [x] 6.2 `tests/rls.test.mjs`: cliente não consegue `insert` em `events`; admin
      consegue; cliente edita o próprio evento. (+ listagem restrita ao admin.)
- [x] 6.3 `npm run verify`.

## 7. Documentação

- [x] 7.1 README: novo fluxo (admin cadastra cliente → cria página → cliente
      recebe link mágico → edita e modera).
- [x] 7.2 `openspec/config.yaml`: atualizar `context`.
