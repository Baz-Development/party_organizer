# Configurar o envio de e-mail com o Resend

Este guia liga o módulo de e-mail do projeto a um provedor real
([Resend](https://resend.com)). Hoje a aplicação usa o `mockEmailProvider`
(nada sai de fato) ou, em desenvolvimento, SMTP para o Mailpit local. Trocar
para o Resend é implementar uma interface e mudar **uma linha**.

## 1. Como o módulo de e-mail funciona

Tudo vive em `src/lib/email/`:

| Arquivo | Papel |
| --- | --- |
| `provider.ts` | Interface `EmailProvider` — contrato mínimo (`send`). |
| `index.ts` | **Ponto único** que escolhe o provedor ativo. |
| `mockEmailProvider.ts` | Sempre "entrega". Padrão atual. |
| `smtpEmailProvider.ts` | SMTP para o Mailpit local (dev). |
| `enqueue.ts` | `enqueueEmail()` insere na fila (`email_messages`). |
| `processQueue.ts` | Reivindica pendentes, resolve o link/segredo, renderiza e chama o provedor. |
| `templates/` | Modelos puros (`convite`, `acesso_painel`, …). |
| `policy.ts` | Novas tentativas, backoff, supressão. |
| `env.ts` | Variáveis de ambiente do módulo, isoladas de `src/lib/env.ts`. |

Fluxo: uma rota chama `enqueueEmail()` → linha em `email_messages` (status
`pendente`) → `processEmailQueue()` (disparado por `after()` best-effort e pelo
`pg_cron` a cada minuto, via `POST /api/interno/fila-email/processar`) →
`provider.send()` → status `entregue` / `falha`.

O redirecionamento/descarte fora de produção **não** é responsabilidade do
provedor: fica em `processQueue.ts` (`resolveRecipient`). Um provedor novo só
precisa implementar `send`.

## 2. Conta e domínio no Resend

1. Crie a conta em <https://resend.com> e um **API Key** (Settings → API Keys),
   com permissão de envio. Guarde — ela só aparece uma vez.
2. Em **Domains**, adicione o domínio de envio (ex.: `alfeventos.com.br`).
3. O Resend mostra os registros DNS a criar no seu provedor de domínio:
   - **SPF**: registro `TXT` em `send.<domínio>` com
     `v=spf1 include:amazonses.com ~all`.
   - **DKIM**: 3 registros `CNAME` (`resend._domainkey`, etc.) apontando para
     `*.dkim.amazonses.com`.
   - **DMARC** (recomendado): `TXT` em `_dmarc.<domínio>` com
     `v=DMARC1; p=none;` (endureça para `quarantine`/`reject` depois de
     validar a entrega).
4. Aguarde a verificação ficar **verde** no painel do Resend antes de enviar em
   produção — domínio não verificado cai em spam ou é recusado.

O e-mail remetente (`EMAIL_FROM_ADDRESS`) precisa estar **nesse** domínio.

## 3. Variáveis de ambiente

Definidas e validadas em `src/lib/email/env.ts`. Em produção (Vercel →
Settings → Environment Variables):

| Variável | Valor |
| --- | --- |
| `EMAIL_FROM_ADDRESS` | Remetente, no domínio verificado. Ex.: `Villa Glam <no-reply@alfeventos.com.br>` ou só `no-reply@alfeventos.com.br`. |
| `EMAIL_FROM_DOMAIN` | O domínio verificado. Ex.: `alfeventos.com.br`. |
| `EMAIL_PROVIDER_API_KEY` | A API key do Resend (`re_...`). Hoje o mock ignora; o provedor do Resend vai lê-la. |
| `EMAIL_QUEUE_CRON_SECRET` | Segredo compartilhado entre o `pg_cron` e `POST /api/interno/fila-email/processar`. Gere um valor aleatório longo. |
| `EMAIL_TEST_REDIRECT_ADDRESS` | **Só fora de produção.** Todo e-mail vai para este endereço em vez do destinatário real. Sem valor, mensagens fora de produção são descartadas. |
| `EMAIL_SMTP_HOST` / `EMAIL_SMTP_PORT` | **Só dev com Mailpit.** Se definidas, o provedor ativo vira SMTP (não o Resend). Deixe **em branco** em produção. |

> Em produção, `APP_ENV`/`isProduction` precisa refletir que é produção, senão
> `resolveRecipient` nunca devolve o endereço real.

## 4. Implementar o `resendEmailProvider`

Instale a dependência:

```bash
npm install resend
```

Crie `src/lib/email/resendEmailProvider.ts`:

```ts
import "server-only";

import { Resend } from "resend";
import { emailEnv } from "./env";
import type { EmailProvider } from "./provider";

/**
 * Provedor de e-mail transacional via Resend.
 *
 * Erro 4xx do Resend (endereço inválido, domínio não verificado) é
 * `permanentFailure` — a fila não reintenta e suprime o endereço. Erro 5xx ou
 * de rede sobe como exceção: a fila trata como falha temporária e reagenda.
 */
const resend = new Resend(emailEnv.EMAIL_PROVIDER_API_KEY);

export const resendEmailProvider: EmailProvider = {
  async send(input) {
    const { data, error } = await resend.emails.send({
      from: emailEnv.EMAIL_FROM_ADDRESS,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      // `name` do SDK: "validation_error", "invalid_parameter", etc. são
      // permanentes; "rate_limit_exceeded" e "application_error" são
      // temporários.
      const temporary =
        error.name === "rate_limit_exceeded" || error.name === "application_error";
      if (temporary) {
        throw new Error(`resend_temporario: ${error.message}`);
      }
      return { permanentFailure: true, reason: `${error.name}: ${error.message}` };
    }

    return { providerMessageId: data?.id ?? "resend_sem_id" };
  },
};
```

Ligue em `src/lib/email/index.ts` — troque a escolha do provedor:

```ts
import { emailEnv } from "./env";
import { mockEmailProvider } from "./mockEmailProvider";
import { resendEmailProvider } from "./resendEmailProvider";
import { smtpEmailProvider } from "./smtpEmailProvider";
import type { EmailProvider } from "./provider";

export const emailProvider: EmailProvider = emailEnv.EMAIL_SMTP_HOST
  ? smtpEmailProvider          // dev: Mailpit
  : emailEnv.EMAIL_PROVIDER_API_KEY.startsWith("re_")
    ? resendEmailProvider      // produção: Resend
    : mockEmailProvider;       // fallback
```

## 5. Agendamento da fila

A rota `POST /api/interno/fila-email/processar` já existe e é protegida pelo
header `x-email-queue-secret` (== `EMAIL_QUEUE_CRON_SECRET`). Duas opções de
agendamento:

- **`pg_cron`** (já configurado em
  `supabase/migrations/20260803180700_email_queue_cron.sql`): o próprio banco
  chama a rota a cada minuto via `pg_net`. Garanta que o segredo e a URL da
  aplicação estão certos no ambiente do banco.
- **Vercel Cron** (`vercel.json`), se preferir não depender do `pg_net`:

  ```json
  {
    "crons": [{ "path": "/api/interno/fila-email/processar", "schedule": "* * * * *" }]
  }
  ```

  O Vercel Cron faz `GET`; a rota hoje só trata `POST`. Ou adapte a rota para
  aceitar `GET` com o mesmo segredo, ou use um pequeno worker. Mantenha **um**
  agendador ativo para não processar em duplicidade (a fila reivindica em lote,
  então concorrência é segura, mas é desperdício).

## 6. Retornos (bounce / spam) → supressão

O Resend expõe webhooks (Settings → Webhooks). Crie um endpoint, ex.
`POST /api/interno/resend/webhook`, que:

1. Valida a assinatura do webhook (`svix` — cabeçalhos `svix-id`,
   `svix-timestamp`, `svix-signature`; use o `RESEND_WEBHOOK_SECRET`).
2. Para `email.bounced` e `email.complained`, insere em `email_suppressions`
   (`reason = 'retorno_permanente'`) o par `event_id` + `email`. O `event_id`
   pode ser recuperado casando `provider_message_id` com `email_messages`.

Com isso `processOne()` passa a pular esses endereços (`isSuppressed`).

## 7. Testar antes de produção

1. **Local com Mailpit**: `EMAIL_SMTP_HOST=localhost`, `EMAIL_SMTP_PORT=1025`.
   Dispare (crie um cliente + página, ou use "Enviar e-mail de acesso" em
   `/admin/clientes`) e veja o e-mail em <http://localhost:8025>.
2. **Staging com Resend**: configure as variáveis do Resend **e**
   `EMAIL_TEST_REDIRECT_ADDRESS` com um e-mail seu. Todo envio real vai para
   você — confirme assunto, links (`/painel`, página do evento, `/entrar`) e
   que **não há segredo** no corpo.
3. **Produção**: remova `EMAIL_TEST_REDIRECT_ADDRESS` e `EMAIL_SMTP_HOST`.
   Faça um envio de teste para um endereço controlado e verifique SPF/DKIM
   ("assinado por" no cabeçalho do e-mail recebido).
4. Rode `node --test tests/email-queue.test.mjs` — a suíte da fila não depende
   de rede e deve continuar verde.
