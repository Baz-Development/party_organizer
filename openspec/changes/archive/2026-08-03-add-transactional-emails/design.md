## Context

Todo módulo anterior já produz o link que este change precisa entregar: token
de convite (`add-guests-rsvp-backend`), recibo de pagamento
(`add-gifts-payments-backend`), link de revelação do amigo secreto
(`add-secret-santa-backend`). Hoje o anfitrião teria que copiar e colar link
por link — não existe caminho de saída automático.

`add-supabase-foundation` já configura SMTP para o magic link de
autenticação de cliente/organização/admin (`supabase/config.toml`,
`[auth.email.smtp]`, comentado para produção). Esse SMTP é do Supabase Auth,
cuida só de e-mail de login, e não passa pelo que este change constrói: fila
própria, modelos de produto, disparo em lote, supressão. As duas coisas
convivem sem se sobrepor.

O projeto já resolveu o problema de "abstrair um provedor externo ainda não
escolhido" em `add-gifts-payments-backend`: `src/lib/payments/provider.ts`
define uma interface mínima, `mockProvider.ts` implementa sem rede, e
`src/lib/payments/env.ts` isola as variáveis de ambiente do módulo do resto
de `src/lib/env.ts`. Este change segue o mesmo molde para e-mail.

## Goals / Non-Goals

**Goals:**
- Enfileirar toda mensagem transacional do produto e enviá-la fora do ciclo
  da requisição, com novas tentativas e limite.
- Seis modelos de mensagem cobrindo convite, lembrete de RSVP, confirmação de
  RSVP, recibo de presente, revelação do amigo secreto e acesso ao painel.
- Disparo em lote de convites com acompanhamento de estado por convidado.
- Supressão por retorno permanente e por descadastro, sem bloquear mensagens
  essenciais (recibo).
- Nenhum ambiente fora de produção entrega a um endereço real.

**Non-Goals:**
- Não escolhe um provedor de e-mail real (SendGrid, Resend, Postmark, ...) —
  fica atrás de uma interface, como pagamento ficou atrás de
  `PaymentProvider`. `mockEmailProvider.ts` é o que roda em todo ambiente até
  um provedor real ser conectado.
- Não constrói editor de template visual — modelos são funções que recebem
  dados tipados e devolvem assunto/corpo, versionadas no código.
- Não reimplementa o e-mail de magic link do Supabase Auth.

## Decisions

### Fila em tabela própria, processada por rota HTTP interna com `pg_cron`

`email_messages` guarda cada mensagem (`status`: `pendente` | `enviando` |
`entregue` | `falha`, `attempts`, `next_attempt_at`, `last_error`). Duas
formas de tirar a fila do ciclo da requisição, usadas juntas:

1. **Tentativa imediata best-effort**: depois de enfileirar, o código chama
   `after()` (`next/server`, confirmado em
   `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`
   como estável nesta versão do Next) para processar a fila só depois da
   resposta já ter sido enviada ao cliente — cobre o caso comum em que o
   mesmo processo ainda está de pé.
2. **Retentativa durável**: `after()` não sobrevive ao fim da invocação
   serverless, então retentativas com backoff crescente não podem depender
   dele. Uma extensão `pg_cron` dispara a cada minuto uma chamada `pg_net`
   para `POST /api/interno/fila-email/processar`, autenticada por um
   segredo compartilhado (`EMAIL_QUEUE_CRON_SECRET`) comparado em tempo
   constante — mesmo padrão de `verifyWebhookSignature` em
   `src/lib/payments/webhookSignature.ts`. A rota reivindica mensagens
   `pendente`/`falha_temporaria` com `next_attempt_at <= now()` via
   `select ... for update skip locked`, para duas execuções sobrepostas do
   cron não processarem a mesma mensagem duas vezes.

**Alternativa rejeitada**: fila de verdade (ex.: `pgmq`, um serviço externo
de mensageria). Rejeitada por escala — o produto envia dezenas a centenas de
mensagens por evento, não volume que justifique operar um broker separado; a
tabela com `pg_cron` já garante "fora do ciclo da requisição" e "novas
tentativas", que é tudo que a spec pede.

### `mockEmailProvider` e redirecionamento por ambiente

`EmailProvider` (interface): `send({ to, subject, html, text }): Promise<{
providerMessageId: string } | { permanentFailure: true, reason: string }>`.
`mockEmailProvider.ts` grava a mensagem como entregue sem rede, igual
`mockProvider.ts` de pagamento faz com checkout.

O interruptor de ambiente não fica dentro do provedor: fica na função que
processa a fila, antes de chamar `send`. Usa `isProduction` de
`src/lib/env.ts` (já existente):

- `production`: envia ao endereço real do destinatário.
- `local`/`staging`: substitui o destinatário por
  `EMAIL_TEST_REDIRECT_ADDRESS` (variável nova) antes de chamar o provedor;
  se a variável não estiver definida, descarta em vez de enviar — nunca cai
  para o endereço real por omissão.

**Alternativa rejeitada**: cada provedor real decidir o redirecionamento.
Rejeitada porque isso duplicaria a regra em cada implementação futura de
`EmailProvider`; centralizá-la na função de processamento da fila garante
que trocar de provedor não reabre a possibilidade de vazar e-mail de teste
para gente real.

### Modelos como funções puras, não linhas de banco

Cada modelo (`convite`, `lembrete_rsvp`, `confirmacao_rsvp`, `recibo_presente`,
`revelacao_amigo_secreto`, `acesso_painel`) é uma função TypeScript em
`src/lib/email/templates/*.ts` que recebe dados já resolvidos (não busca nada
sozinha) e devolve `{ subject, html, text }`. `email_messages.template`
guarda o nome do modelo e `email_messages.data` (jsonb) guarda os dados
usados, para reconstrução em log/depuração sem duplicar o corpo renderizado.

**Risco already coberto pela spec**: o corpo com token/link não pode aparecer
em log. Por isso o `data` gravado em `email_messages` guarda os campos que
formam a mensagem (nome do evento, nome do destinatário) mas **não** o token
nem a URL completa — a função de modelo recebe o token só na hora de
renderizar, via parâmetro separado que não é persistido.

### Quem enfileira: TypeScript, não a função SQL que originou a ação

`submit_rsvp`, `process_payment_event` e `run_secret_santa_draw` continuam
sem saber que e-mail existe — enfileirar a partir de dentro dessas funções
misturaria a responsabilidade de negócio com a de notificação, e essas
funções já são `security definer` chamadas por client anônimo, que não deve
ganhar a capacidade de inserir em `email_messages` diretamente.

Em vez disso, cada rota de API que já chama essas funções (ex.:
`src/app/api/rsvp/[token]/route.ts`, `src/app/api/pagamentos/webhook/route.ts`)
passa a, depois de confirmar sucesso, enfileirar a mensagem correspondente
via uma função própria de e-mail (`src/lib/email/enqueue.ts`), usando o
client `service_role` (a própria rota já é server-only). Disparo em lote de
convite é o único caso com rota nova dedicada
(`POST /api/eventos/[slug]/convidados/enviar-convites`).

### Supressão: tabela própria, checada na hora de processar, não na hora de enfileirar

`email_suppressions (event_id, email, reason, created_at)` — `reason`:
`retorno_permanente` | `descadastro`. A checagem acontece dentro da rota que
processa a fila, não na hora de enfileirar, porque enfileirar é uma ação
best-effort e barata; a rota de processamento já é o ponto único que decide
"esta mensagem sai ou não", incluindo essa regra. Mensagem cujo `template`
está na lista de "essencial" (`recibo_presente`, hoje o único) ignora
supressão por `descadastro`, mas **não** ignora `retorno_permanente` — um
endereço que não existe continua não existindo mesmo para recibo.

## Novas tabelas

- `email_messages`: fila e histórico.
- `email_suppressions`: supressão por evento + e-mail.

## Novas variáveis de ambiente

- `EMAIL_PROVIDER_API_KEY`: reservada para quando um provedor real substituir
  `mockEmailProvider.ts` (não lida pelo mock, mesmo padrão de
  `PAYMENT_PROVIDER_SECRET_KEY`).
- `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_DOMAIN`: remetente por ambiente.
- `EMAIL_TEST_REDIRECT_ADDRESS`: destino de teste em `local`/`staging`; sem
  valor, mensagens fora de produção são descartadas em vez de enviadas.
- `EMAIL_QUEUE_CRON_SECRET`: segredo comparado em tempo constante pela rota
  interna que o `pg_cron` chama.

## Risks / Trade-offs

- **`pg_cron`/`pg_net` não habilitados no projeto Supabase de produção** →
  Mitigação: habilitar como parte da migration deste change
  (`create extension if not exists pg_cron`/`pg_net`), igual qualquer outra
  extensão do projeto — já é prática corrente (`pgcrypto` na fundação).
- **Cron de 1 minuto atrasa recibo/convite em relação a envio síncrono** →
  Mitigação: a tentativa via `after()` cobre a maioria dos casos com latência
  de segundos; o cron é a rede de segurança para quando o processo não
  sobrevive até `after()` rodar.
- **Rota interna de processamento vira alvo se o segredo vazar** → Mitigação:
  mesma prática de `PAYMENT_WEBHOOK_SECRET` — comparação em tempo constante,
  nunca logado, e a rota não aceita nada além de "processe o que está
  pendente" (não recebe payload arbitrário de quem chama).
- **Modelo `recibo_presente` ignorando supressão de descadastro pode
  surpreender quem pediu para não receber mais nada** → Mitigação: já é
  requisito explícito da spec ("Mensagem essencial após descadastro"); o
  rodapé do recibo deixa claro que é resposta direta ao pagamento, não
  comunicação recorrente.

## Migration Plan

1. Habilitar `pg_cron`/`pg_net`, criar `email_messages`/`email_suppressions`,
   RLS e função de agendamento do cron — sem nenhuma rota ainda os usando.
2. Ligar o enfileiramento nas rotas existentes (RSVP, pagamento, sorteio),
   uma de cada vez, testável isoladamente.
3. Rota de disparo em lote e descadastro por último — dependem só da fila já
   funcionando.

Rollback: desabilitar o job de `pg_cron` (`cron.unschedule`) interrompe o
processamento sem perder dados; as tabelas ficam com mensagens `pendente`
até serem reabilitadas.
