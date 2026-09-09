## Why

Hoje o cliente anfitrião só recebe um e-mail automático (`acesso_painel`) no
exato momento em que a primeira página dele é criada por `POST /api/eventos`, e
esse e-mail traz apenas um link para `/painel` — sem o endereço da página do
evento e sem dizer com qual e-mail e por onde a pessoa entra. Se esse disparo
falha, se o admin termina de montar a página só depois, ou se o cliente perde a
mensagem, não existe nenhuma forma de reenviar essas informações pelo produto: o
admin fica sem ação na tela de Clientes.

## What Changes

- O modelo de e-mail `acesso_painel` passa a incluir o título e o endereço
  público da página do evento (`/[id]/[slug]`), o e-mail de acesso do cliente e
  a instrução de login (solicitar o link mágico em `/entrar`). Continua sem
  segredo — nenhum token de sessão vai no corpo.
- Nova ação na tela `/admin/clientes` (`ClientesManager`): para cada conta de
  cliente com pelo menos um evento, um botão **Enviar e-mail de acesso** que
  enfileira o `acesso_painel` para o evento mais recente daquele cliente e
  processa a fila. Contas sem evento mostram o botão desabilitado com o motivo.
- Novo endpoint `POST /api/admin/clientes/[id]/acesso` (somente admin) que
  resolve o e-mail e o evento do cliente, enfileira a mensagem via
  `enqueueEmail` e dispara `processEmailQueue` em `after()`, no mesmo padrão de
  `POST /api/eventos`.
- Novo documento `docs/email-resend.md` ensinando a configurar um provedor real
  de e-mail com o Resend: conta, verificação de domínio (SPF/DKIM/DMARC), chave
  de API, variáveis de ambiente, implementação de `resendEmailProvider.ts`
  cumprindo a interface `EmailProvider`, ligação em `src/lib/email/index.ts`,
  o cron da fila e o tratamento de retornos (bounce) para `email_suppressions`.

Sem mudança de banco: `email_messages`, `email_suppressions` e o enum
`email_template` já existem e cobrem o caso.

## Capabilities

### New Capabilities

Nenhuma. O comportamento cai em capacidades já existentes.

### Modified Capabilities

- `notificacoes-email`: o modelo de acesso ao painel passa a exigir o endereço
  da página do evento e a identificação de login (e-mail + onde autenticar),
  além do link do painel.
- `administracao`: o admin passa a poder disparar manualmente, pela listagem de
  clientes, o e-mail de acesso ao painel de um cliente já provisionado que tenha
  evento.

## Impact

- **Código**: `src/lib/email/templates/acessoPainel.ts` (novos campos de
  `AcessoPainelData` e corpo), `src/lib/email/processQueue.ts` (montagem do
  `data` do `acesso_painel` com slug/e-mail), `src/app/admin/clientes/ClientesManager.tsx`
  (botão + estado de envio), `src/lib/db/clients.ts` (expor `latestEventId`/`latestEventSlug`
  ou consulta no endpoint).
- **APIs**: nova rota `POST /api/admin/clientes/[id]/acesso`; `POST /api/eventos`
  passa a montar o `data` novo do `acesso_painel` (retrocompatível).
- **Infra/config**: nenhuma variável nova obrigatória; `docs/email-resend.md`
  documenta `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_DOMAIN`,
  `EMAIL_QUEUE_CRON_SECRET` já previstas em `src/lib/email/env.ts`.
- **Dependências**: `resend` entra como dependência apenas quando o provedor real
  for adotado (documentado, não instalado por este change).
