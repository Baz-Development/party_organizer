## 1. Migrations — extensões e schema

- [x] 1.1 `supabase/migrations/..._email_extensions.sql`: `create extension if
      not exists pg_cron`, `create extension if not exists pg_net` (schema
      `extensions`, mesmo padrão de `pgcrypto` na fundação).
- [x] 1.2 `supabase/migrations/..._email_enums.sql`: `email_status`
      (`pendente`, `enviando`, `entregue`, `falha`), `email_template`
      (`convite`, `lembrete_rsvp`, `confirmacao_rsvp`, `recibo_presente`,
      `revelacao_amigo_secreto`, `acesso_painel`), `email_suppression_reason`
      (`retorno_permanente`, `descadastro`).
- [x] 1.3 `supabase/migrations/..._email_messages.sql`: tabela
      `email_messages` (`event_id`, `recipient_email`, `template`, `data
      jsonb`, `status`, `attempts integer default 0`, `next_attempt_at`,
      `last_error`, `provider_message_id`, `created_at`, `updated_at`),
      índice em `(status, next_attempt_at)` para a reivindicação do
      processador, índice em `event_id`. Trigger `touch_updated_at`.
- [x] 1.4 `supabase/migrations/..._email_suppressions.sql`: tabela
      `email_suppressions` (`event_id`, `email`, `reason`, `created_at`),
      unique `(event_id, email)`.
- [x] 1.5 Rodar `npx --no-install supabase db reset` e `npm run db:types`;
      conferir que `src/lib/database.types.ts` ganhou as 2 tabelas novas.

## 2. Migrations — RLS, grants e agendamento do cron

- [x] 2.1 `supabase/migrations/..._rls_email.sql`: `enable row level
      security` nas 2 tabelas; `select` de `email_messages` só para
      `can_manage_event`; `select`/`insert`/`delete` de `email_suppressions`
      só para `can_manage_event`, mais função `security definer` própria
      para o fluxo de descadastro sem conta (task 5.3).
- [x] 2.2 `grant all ... to service_role` nas 2 tabelas (a migration de
      fundação não alcança tabela criada depois).
- [x] 2.3 `supabase/migrations/..._email_queue_cron.sql`: `cron.schedule`
      chamando `net.http_post` para a rota interna de processamento a cada
      minuto. Desvio do texto original desta task: o segredo e a URL base não
      vêm de `app.email_queue_cron_secret` fixo, e sim de duas GUCs
      (`app.settings.email_base_url`, `app.settings.email_queue_cron_secret`)
      lidas com `current_setting(..., true)` (não erra se ausente) e
      configuradas fora de git via `alter database ... set`, uma vez por
      ambiente — documentado no cabeçalho da própria migration. Também criada
      `20260803180500_email_queue_functions.sql`
      (`claim_pending_email_messages`, reivindicação atômica via
      `for update skip locked`, só `service_role`) e
      `20260803180600_email_suppression_functions.sql` (`unsubscribe_email`).
- [x] 2.4 Rodar `npx --no-install supabase db reset` de novo e confirmar que
      `20260803121000_assert_rls_enabled.sql` não falha.

## 3. Provedor e ambiente

- [x] 3.1 `src/lib/email/env.ts`: schema Zod isolado (`EMAIL_PROVIDER_API_KEY`,
      `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_DOMAIN`, `EMAIL_QUEUE_CRON_SECRET`
      obrigatórias; `EMAIL_TEST_REDIRECT_ADDRESS` opcional), seguindo o
      padrão de `src/lib/payments/env.ts`.
- [x] 3.2 `src/lib/email/provider.ts`: interface `EmailProvider`
      (`send({ to, subject, html, text }): Promise<{ providerMessageId:
      string } | { permanentFailure: true; reason: string }>`).
- [x] 3.3 `src/lib/email/mockEmailProvider.ts`: implementação local sem rede,
      usada em todo ambiente até um provedor real ser configurado.
- [x] 3.4 `src/lib/email/index.ts`: ponto único que instancia o provedor
      ativo (hoje sempre o mock), espelhando `src/lib/payments/index.ts`.
- [x] 3.5 `.env.example`: adicionar as 5 variáveis novas, sem valor real.

## 4. Modelos de mensagem

- [x] 4.1 `src/lib/email/templates/convite.ts`,
      `lembreteRsvp.ts`, `confirmacaoRsvp.ts`, `reciboPresente.ts`,
      `revelacaoAmigoSecreto.ts`, `acessoPainel.ts`: cada um exporta uma
      função que recebe dados tipados (mais o token/link como parâmetro
      separado, não persistido) e devolve `{ subject, html, text }`.
      `revelacaoAmigoSecreto` nunca recebe nem inclui o nome da pessoa
      sorteada — só o link da própria revelação.
- [x] 4.2 `src/lib/email/templates/index.ts`: mapa `template -> render`,
      usado pelo processador da fila.

## 5. Fila — enfileiramento, processamento e supressão

- [x] 5.1 `src/lib/email/enqueue.ts`: `enqueueEmail(admin, { eventId,
      recipientEmail, template, data })` — insere em `email_messages` com
      `status = 'pendente'`. Desvio: sem parâmetro `secret` aqui — o segredo
      nunca existe neste ponto da cadeia, porque quem chama `enqueueEmail`
      não guarda token algum; `data` carrega só uma referência não-sensível
      (`guestId`), e `processQueue.ts` resolve o token de convite fresco via
      `guest_invites` na hora de renderizar (o `guestId` sozinho não abre
      nada sem essa consulta server-only). Convidado sem e-mail: quem chama
      decide não invocar `enqueueEmail`. Também criado
      `src/lib/email/context.ts` (`resolveGuestEmailContext`) e
      `enqueueRsvpConfirmationEmail` (mesmo arquivo de `enqueue.ts`) para as
      duas rotas de RSVP compartilharem a resolução de nome/e-mail/evento.
- [x] 5.2 `src/lib/email/processQueue.ts`: reivindica mensagens via
      `claim_pending_email_messages` (RPC, `for update skip locked`
      dentro da função — ver 2.3); para cada uma, checa `email_suppressions`
      (ignorando supressão por `descadastro` quando o template é
      `recibo_presente`, nunca ignorando `retorno_permanente`), resolve o
      link (token de `guest_invites` via `guestId`, quando o modelo precisa),
      renderiza o modelo, chama o provedor (redirecionando para
      `EMAIL_TEST_REDIRECT_ADDRESS` ou descartando fora de produção, via
      `isProduction` de `src/lib/env.ts`), atualiza
      `status`/`attempts`/`next_attempt_at` (backoff exponencial, teto de 30
      min) ou marca `falha` no limite de tentativas (5). Desvio: usa só os 4
      status do enum do design (`pendente`/`enviando`/`entregue`/`falha`) —
      falha temporária volta para `pendente` com `next_attempt_at` no futuro,
      não existe `falha_temporaria` como status próprio.
- [x] 5.3 `supabase/migrations/..._email_suppression_functions.sql`:
      `unsubscribe_email(p_event_id uuid, p_email text)` — `security
      definer`, insere supressão `descadastro`, chamável sem conta. Grant
      `execute` a `anon, authenticated`.
- [x] 5.4 Registrar retorno permanente do provedor como supressão
      `retorno_permanente` dentro de `processQueue.ts` (não precisa de
      função SQL própria — é o próprio processador escrevendo o resultado).

## 6. Rota interna do cron

- [x] 6.1 `src/app/api/interno/fila-email/processar/route.ts`: `POST`
      compara o header do segredo em tempo constante contra
      `EMAIL_QUEUE_CRON_SECRET` (mesmo padrão de
      `verifyWebhookSignature`), chama `processQueue`, devolve contagem
      processada/entregue/falha. Sem esse header correto, 401 sem processar
      nada.

## 7. Ligar o enfileiramento nas ações existentes

- [x] 7.1 `src/app/api/rsvp/[token]/route.ts` e
      `src/app/api/eventos/[slug]/rsvp-aberto/route.ts`: depois de
      `submitRsvp`/`submitOpenRsvp` bem-sucedido, se o convidado tem e-mail,
      `enqueueEmail` com template `confirmacao_rsvp`; chamar `after()` para
      disparar `processQueue` best-effort sem bloquear a resposta.
- [x] 7.2 `src/app/api/pagamentos/webhook/route.ts`: quando
      `process_payment_event` resolve o pagamento como confirmado,
      `enqueueEmail` com template `recibo_presente` para o e-mail do
      pagador; `after()` best-effort.
- [x] 7.3 Rota de execução do sorteio de amigo secreto
      (`src/app/api/eventos/[slug]/amigo-secreto/sorteio/route.ts`, de
      `add-secret-santa-backend`): depois de `runSecretSantaDraw`
      bem-sucedido, `enqueueEmail` com template `revelacao_amigo_secreto`
      para cada participante com e-mail cadastrado (via `guests.email`,
      resolvido pelo `guest_id` do participante) — sem incluir quem foi
      sorteado no `data` persistido; `after()` best-effort.

## 8. Disparo em lote e painel

- [x] 8.1 `src/app/api/eventos/[slug]/convidados/enviar-convites/route.ts`:
      `POST` recebe lista de `guest_id` (ou "todos os pendentes"), escopado
      pela RLS via `getEventBySlug`/client autenticado (mesmo padrão das
      demais rotas de `/painel`, sem checagem explícita de
      `can_manage_event` porque a RLS já resolve isso), enfileira `convite`
      para cada um com e-mail (reporta os sem e-mail em `naoEnviaveis`, sem
      falhar o lote), `after()` best-effort.
- [x] 8.2 `src/app/api/eventos/[slug]/convidados/historico-emails/route.ts`:
      `GET`, mesmo padrão de escopo por RLS, lista `email_messages` do
      evento (destinatário, template, status, data) para a tela de
      acompanhamento.
- [x] 8.3 `src/lib/db/emails.ts`: `listEmailHistory` (camada de dados
      server-side usada pela rota 8.2, seguindo o padrão de `src/lib/db/*.ts`
      do projeto — não um wrapper client-side; nenhum componente cliente
      importa `src/lib/db/*` em runtime, só `fetch` direto, então
      `triggerGuestInvites` não existe como função separada — a lógica do
      lote já mora inteira na rota 8.1).
- [x] 8.4 `GuestManager.tsx` (`src/app/painel/convidados/`): botão "Enviar
      convites pendentes" (lote) e "Reenviar convite" por convidado na
      Sheet de detalhe, mais Sheet de "Histórico de e-mails" (status,
      modelo, data, erro) usando as rotas de 8.1/8.2.

## 9. Descadastro público

- [x] 9.1 `src/app/e/[slug]/descadastro/page.tsx` +
      `DescadastroConfirm.tsx` (client, com botão de confirmação — não
      descadastra sozinho ao abrir o link, para não ser disparado por
      scanner de segurança de provedor de e-mail) +
      `src/app/api/eventos/[slug]/descadastro/route.ts`: recebe `email` via
      link da mensagem (`?email=`), chama `unsubscribe_email`, confirma ao
      usuário.

## 10. Testes

- [x] 10.1 `tests/email-queue.test.mjs`: criado. Desvio importante:
      `processQueue.ts`/`enqueue.ts` importam `"server-only"` (que lança ao
      ser importado fora do bundle Next), então — igual ao único precedente
      do projeto (`tests/webhook.test.mjs`, que só importa
      `webhookSignature.ts`, sem esse import) — o teste não importa esses
      dois arquivos direto. Em vez disso, extraí a lógica pura e sem
      segredo (backoff, "essencial ignora descadastro", limite de
      tentativas) para `src/lib/email/policy.ts` (sem `"server-only"`,
      testado direto) e testei o resto (reivindicação atômica, elegibilidade
      por `next_attempt_at`, estado após falha permanente) no nível do
      banco, com `claim_pending_email_messages` via `admin`. Backoff e
      limite de tentativas cobertos como unidade pura; "nunca chama o
      provedor com endereço real fora de produção" não tem teste
      automatizado ponta a ponta — depende de `processQueue.ts` chamar
      `emailProvider.send`, código server-only que exigiria subir o servidor
      Next dentro da suíte (nenhum teste deste projeto faz isso hoje) —
      fica coberto por revisão de código, não por teste.
- [x] 10.2 Desvio de escopo: "lote parcialmente falho"/"convidado sem
      e-mail"/"reenvio usa o mesmo token" são comportamento da rota
      `POST /api/eventos/[slug]/convidados/enviar-convites`
      (`src/app/api/.../enviar-convites/route.ts`), que também depende de
      `enqueueEmail` (server-only) — mesma limitação de 10.1. Não coberto
      por teste automatizado; a rota foi exercitada manualmente e por
      `npm run build`/`typecheck`. Registrado como lacuna de cobertura, não
      como concluído silenciosamente.
- [x] 10.3 `tests/email-queue.test.mjs`, `describe("supressão")`: retorno
      permanente sempre bloqueia (mesmo `recibo_presente`); descadastro
      bloqueia mensagem comum mas não `recibo_presente`; `unique (event_id,
      email)` recusa duplicata. "Histórico de mensagens não vaza para outra
      organização" coberto em `tests/rls.test.mjs`
      (`describe("fila e supressão de e-mail")`), não neste arquivo.
- [ ] 10.4 Não implementado como teste automatizado — mesma limitação de
      10.1/10.2 (`enqueueEmail`/`processQueue.ts` são server-only). O
      invariante "token nunca entra em `data`" é garantido pelo contrato de
      tipos: `enqueueEmail` não tem parâmetro de segredo/token, e todo
      `data` persistido nas rotas (`resolveGuestEmailContext`,
      `enqueueRsvpConfirmationEmail`, rota de sorteio, rota de recibo) só
      carrega `guestId`/campos de exibição — verificável por revisão de
      código (`src/lib/email/enqueue.ts`, `processQueue.ts`), não por teste.
      Deixado como lacuna explícita para o coordenador decidir se vale
      investir em subir o servidor Next dentro da suíte para fechar isso.
- [x] 10.5 `tests/rls.test.mjs`, `describe("fila e supressão de e-mail")`:
      `email_messages`/`email_suppressions` só alcançáveis por quem
      administra o evento; `anon` sem grant de insert em `email_messages`;
      `unsubscribe_email` funciona sem conta e é idempotente.
