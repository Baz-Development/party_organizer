## 1. Modelo `acesso_painel` com página e login

- [x] 1.1 Consultar `node_modules/next/dist/docs/` no que toca route handlers e `after()` antes de mexer nas rotas.
- [x] 1.2 Estender `AcessoPainelData` em `src/lib/email/templates/acessoPainel.ts` com `eventSlug`, `eventId` e `loginEmail` opcionais.
- [x] 1.3 Atualizar `renderAcessoPainel` para montar a URL pública da página (`${NEXT_PUBLIC_SITE_URL}/${eventId}/${eventSlug}`) e incluir no HTML e no texto: título do evento, endereço da página, e-mail de acesso e a instrução de solicitar o link de entrada em `/entrar`. Degradar quando os campos opcionais faltarem (corpo curto atual).
- [x] 1.4 Em `src/lib/email/processQueue.ts`, no ramo `message.template === "acesso_painel"`, repassar `data` (slug, eventId, loginEmail) ao renderer além do `link` do painel.
- [x] 1.5 Ajustar `POST /api/eventos/route.ts` para enfileirar o `acesso_painel` com `data: { eventTitle, eventSlug: event.slug, eventId: event.id, loginEmail: hostEmail }`.

## 2. Endpoint de reenvio pelo admin

- [x] 2.1 Criar `src/lib/validation/` ou reaproveitar validação para o parâmetro opcional `eventId` da nova rota.
- [x] 2.2 Criar `src/app/api/admin/clientes/[id]/acesso/route.ts` com `POST`, guardado por `requireAdminApi()`.
- [x] 2.3 Na rota: validar que `[id]` é um perfil com `role = 'cliente'` (400 caso contrário) e resolver o e-mail via `getUserEmail` (400 se ausente).
- [x] 2.4 Na rota: buscar o evento mais recente do cliente via `listEvents(admin, { hostProfileId })` ordenado por `created_at desc`; sem evento → 409 com mensagem "cliente ainda não tem página". Aceitar `eventId` do body para escolher outro evento do mesmo cliente.
- [x] 2.5 Na rota: `enqueueEmail` com `template: "acesso_painel"` e o `data` completo; `after(() => processEmailQueue(admin))`; responder `{ ok: true }`.
- [x] 2.6 Verificar/estender `listEvents` para ordenar por `created_at desc` (ou ordenar no handler).

## 3. Ação na tela de Clientes

- [x] 3.1 Em `src/app/admin/clientes/ClientesManager.tsx`, adicionar coluna/célula de ação com botão "Enviar e-mail de acesso" por linha.
- [x] 3.2 Desabilitar o botão quando `c.eventCount === 0`, com tooltip/hint "cadastre uma página para este cliente primeiro".
- [x] 3.3 Ao acionar: `fetch("/api/admin/clientes/{id}/acesso", { method: "POST" })` com estado de carregando/ok/erro por linha (via `useTransition` + `useState` indexado pelo id).
- [x] 3.4 Mostrar mensagem de sucesso ("E-mail de acesso enfileirado para {email}") e de erro vindas da resposta.
- [x] 3.5 Atualizar o comentário de cabeçalho do componente para refletir que agora há disparo manual daqui.

## 4. Documentação do provedor Resend

- [x] 4.1 Criar `docs/email-resend.md` com: visão geral do módulo de e-mail (fila, `EmailProvider`, ponto de troca em `src/lib/email/index.ts`).
- [x] 4.2 Documentar criação de conta no Resend, verificação de domínio (registros SPF `TXT`, DKIM `CNAME`, DMARC) e geração da API key.
- [x] 4.3 Documentar as variáveis de ambiente: `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_DOMAIN`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_QUEUE_CRON_SECRET`, `EMAIL_TEST_REDIRECT_ADDRESS`, `EMAIL_SMTP_HOST` (dev/Mailpit).
- [x] 4.4 Incluir código de referência de `src/lib/email/resendEmailProvider.ts` implementando `EmailProvider.send` (mapa status HTTP do Resend → `{ providerMessageId }` ou `{ permanentFailure, reason }`) e a alteração de uma linha em `src/lib/email/index.ts`.
- [x] 4.5 Documentar o agendamento do cron da fila (`src/app/api/interno/fila-email/processar/route.ts` + Vercel Cron com o header do `EMAIL_QUEUE_CRON_SECRET`).
- [x] 4.6 Documentar o webhook de `email.bounced` / `email.complained` do Resend gravando em `email_suppressions`, e o checklist de teste local com `EMAIL_TEST_REDIRECT_ADDRESS`.
- [x] 4.7 Referenciar `docs/email-resend.md` no `README` do projeto ou no índice de docs existente.

## 5. Testes e verificação

- [x] 5.1 Cobertura do `renderAcessoPainel` e da rota `POST /api/admin/clientes/[id]/acesso` segue a convenção já documentada em `tests/email-queue.test.mjs` (revisão de código + contrato de tipos): `acessoPainel.ts` importa `./base` sem extensão e não é carregável pelo `node --test` como os módulos-folha; a rota exigiria subir o Next na suíte, o que nenhum teste faz hoje. `typecheck` cobre os contratos.
- [x] 5.2 `npx tsc --noEmit` e `npx eslint` limpos nos arquivos alterados. `tests/email-queue.test.mjs` (regras puras de `policy.ts`) verde; o bloco "(banco)" exige `npm run db:start` (ambiente).
- [ ] 5.3 Verificação manual com Mailpit: cadastrar cliente, criar página, acionar "Enviar e-mail de acesso" e conferir o conteúdo do e-mail (endereço da página, e-mail de login, link `/entrar`, sem segredo).
