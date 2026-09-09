## Context

A infraestrutura de e-mail já existe e está madura: fila em `email_messages`,
`processEmailQueue`, `enqueueEmail`, provedores plugáveis (`EmailProvider`) e
seis modelos, entre eles `acesso_painel`. O único disparo do `acesso_painel`
hoje está em `POST /api/eventos/route.ts`, logo após `createEvent`, e o corpo
resultante (`src/lib/email/templates/acessoPainel.ts`) só tem
`<p>O painel de X está pronto…</p>` + link para `/painel`.

Limitações que motivam o change:

1. O modelo não diz **qual página** foi criada nem **como o cliente entra**
   (com qual e-mail, por onde). O produto usa magic link via `/entrar`.
2. Não há reenvio: se o disparo em `POST /api/eventos` falhar, se a página for
   finalizada só depois, ou se o cliente perder o e-mail, o admin não tem botão.
3. Produção ainda roda no `mockEmailProvider` — nada sai de fato. Falta um guia
   de como plugar um provedor real (Resend).

Restrições: Next.js 16 (App Router, breaking changes — consultar
`node_modules/next/dist/docs/` antes de escrever rota/handler); `email_messages`
exige `event_id` NOT NULL e só `service_role` faz `insert`; o segredo (token)
nunca é persistido na fila — é resolvido em `processQueue` na renderização.

## Goals / Non-Goals

**Goals:**

- `acesso_painel` passa a carregar título do evento, URL pública da página,
  e-mail de acesso do cliente e instrução de login (`/entrar`).
- Botão "Enviar e-mail de acesso" por linha em `/admin/clientes`, com endpoint
  admin dedicado, reaproveitando `enqueueEmail` + `processEmailQueue`.
- `docs/email-resend.md`: guia completo de configuração do Resend como provedor
  real, sem instalar a dependência neste change.

**Non-Goals:**

- Não instalar `resend` nem trocar o provedor ativo agora (fica documentado).
- Não mudar schema (`email_messages`, `email_suppressions`, enum `email_template`
  já bastam).
- Não criar histórico de e-mails de acesso na UI de admin (a auditoria da fila
  já cobre; fora de escopo desta tela).
- Não mexer no fluxo de convite de convidado nem nos demais modelos.

## Decisions

### 1. Expandir `acesso_painel` em vez de criar um modelo novo

`AcessoPainelData` ganha campos opcionais: `eventSlug`, `eventId`, `pageUrl`
(ou montado no template a partir de `NEXT_PUBLIC_SITE_URL` + `/[id]/[slug]`),
`loginEmail`. O `processQueue` já monta `link` = `${SITE_URL}/painel` para
`acesso_painel`; passa a também repassar o `data` recebido (slug, e-mail) ao
`emailTemplates.acesso_painel`. Como os campos são opcionais e o template
degrada quando faltam, mensagens já enfileiradas antes do deploy continuam
renderizando.

- Alternativa descartada: modelo `acesso_cliente` novo — exigiria alterar o
  enum `email_template` (migration) e o mapa de templates, sem ganho real.

### 2. Endpoint `POST /api/admin/clientes/[id]/acesso`

Route handler novo, guardado por `requireAdminApi()`. Passos:

1. Resolve o perfil `[id]` — precisa existir e ter `role = 'cliente'`
   (mesma checagem de `POST /api/eventos`), senão 400.
2. `getUserEmail(id)` para o destinatário; sem e-mail → 400.
3. Busca o evento mais recente do cliente: `listEvents(admin, { hostProfileId: id })`
   ordenado por `created_at desc`, pega o primeiro. Sem evento → 409 com
   mensagem "cliente ainda não tem página".
4. `enqueueEmail(admin, { eventId, recipientEmail, template: "acesso_painel",
   data: { eventTitle, eventSlug, loginEmail } })`.
5. `after(() => processEmailQueue(admin))`, responde 202/200 `{ ok: true }`.

Espelha exatamente o bloco já existente em `POST /api/eventos`. O
`ClientesManager` chama por `fetch`, com estado de carregando/ok/erro por linha
(reaproveita o padrão de `useTransition` já no componente).

- Alternativa descartada: parâmetro de evento explícito na UI — o cliente quase
  sempre tem um evento só; "mais recente" é previsível e simples. Se no futuro
  precisar escolher, a rota aceita `?eventId=` opcional.

### 3. `latestEvent` na listagem ou consulta no endpoint

Para desabilitar o botão quando `eventCount === 0`, o `ClientesManager` já tem
`eventCount` de `listClientAccounts`. O endpoint faz a resolução real do evento
server-side — a UI não precisa do slug. Então **não** alteramos
`list_client_accounts`; só usamos `eventCount > 0` para habilitar o botão.

### 4. `docs/email-resend.md` — guia, não código

Conteúdo: criação da conta Resend; adicionar e verificar o domínio (registros
SPF `TXT`, DKIM `CNAME`, DMARC); gerar API key; preencher `EMAIL_FROM_ADDRESS`,
`EMAIL_FROM_DOMAIN`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_QUEUE_CRON_SECRET`,
`EMAIL_TEST_REDIRECT_ADDRESS`; código de referência de
`src/lib/email/resendEmailProvider.ts` implementando `EmailProvider.send`
(retorno `{ providerMessageId }` / `{ permanentFailure, reason }` a partir do
status HTTP do Resend); troca da linha em `src/lib/email/index.ts`; configurar o
cron da fila (Vercel Cron → `GET/POST /api/internal/email-queue` com o header do
`EMAIL_QUEUE_CRON_SECRET`); webhook de `email.bounced`/`email.complained` do
Resend gravando em `email_suppressions`; checklist de teste local com
`EMAIL_TEST_REDIRECT_ADDRESS`.

## Risks / Trade-offs

- [Admin dispara para o evento "errado" quando o cliente tem vários] → a
  mensagem identifica o evento pelo título no corpo; a rota aceita `eventId`
  opcional para o caso raro.
- [E-mail sem segredo pode parecer "incompleto" para o cliente] → é intencional
  e o texto explica: o acesso é sempre por link mágico. O modelo continua sem
  token, alinhado à decisão "Modelos como funções puras".
- [Fora de produção nada chega ao cliente real] → comportamento já existente
  (`resolveRecipient`); o guia do Resend documenta `EMAIL_TEST_REDIRECT_ADDRESS`.
- [Guia do Resend desatualizar] → manter o guia focado nas variáveis e na
  interface `EmailProvider` (estáveis), não em telas da Resend.

## Migration Plan

1. Sem migration de banco. Deploy do código.
2. Campos novos de `AcessoPainelData` são opcionais → nenhuma mensagem pendente
   quebra.
3. Rollback: reverter o commit; o endpoint novo deixa de existir e o template
   volta ao corpo curto. Nada a desfazer em dados.
4. Adoção do Resend é um passo separado, guiado por `docs/email-resend.md`,
   fora deste change.

## Open Questions

- O cron interno da fila já existe (`src/app/api/interno/fila-email/processar/route.ts`,
  protegido por `EMAIL_QUEUE_CRON_SECRET`); o guia do Resend só precisa apontar
  para ele e para o agendamento (Vercel Cron), não criá-lo.
- A tela de admin deve mostrar a data do último envio de acesso? Assumido que
  não nesta iteração.
