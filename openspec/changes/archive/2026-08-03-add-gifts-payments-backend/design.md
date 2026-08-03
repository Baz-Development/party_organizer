## Context

`/e/[slug]/presentes` hoje é 100% fixture (`src/lib/fixtures/gifts.ts`): lista,
checkout e tela de sucesso existem visualmente, mas nenhum presente é reservado,
nenhuma cota soma e nenhum dinheiro muda de mãos. `GET /api/eventos/[slug]/presentes`
devolve o array fixo, filtrado em memória.

Este change persiste o catálogo de presentes, a reserva com expiração, as cotas e o
ciclo de pagamento — checkout, confirmação por webhook assinado, idempotência e
reembolso — seguindo o padrão estabelecido por `add-guests-rsvp-backend`:
`supabase/migrations/*.sql` pequenas e datadas, funções `security definer` para o
caminho do convidado sem conta, RLS por tabela construída sobre
`can_manage_event`/`is_event_public` (`20260803120500_authorization_functions.sql`),
camada de dados em `src/lib/db/*.ts` recebendo o client do chamador, validação Zod em
`src/lib/validation/*.ts`.

Diferença central em relação ao módulo de convidados: aqui existe dinheiro real. A
proposta já fixa três invariantes que o design tem que preservar:

1. o valor cobrado é sempre calculado no servidor, nunca aceito do cliente;
2. um pagamento só é confirmado por webhook assinado — o retorno do navegador não
   prova nada;
3. o mesmo evento de pagamento processado duas vezes (reentrega do provedor) só
   pode ter efeito uma vez.

## Goals / Non-Goals

**Goals:**

- Catálogo de presentes por evento (`gifts`), com estado `disponivel` / `reservado`
  / `comprado`, cota opcional (`quota_target_cents` / `quota_raised_cents`).
- Reserva de presente simples com expiração automática (lida no momento da
  próxima tentativa de reserva/checkout — sem depender de cron), garantindo que
  duas reservas concorrentes do mesmo presente não coexistam.
- Contribuição de cota com contabilidade que não ultrapassa a meta mesmo sob
  concorrência (`quota_reserved_cents` como valor "em voo", debitado só na
  confirmação ou liberado na falha/expiração).
- Checkout com valor determinado pelo servidor a partir do presente/cota no banco.
- Confirmação exclusivamente por webhook assinado (HMAC), com idempotência por
  `payment_events` + guarda de estado em `payments`.
- Reembolso/estorno revertendo presente ou cota ao estado anterior.
- Auditoria: `payments` guarda o identificador do provedor; `payment_events` guarda
  o payload bruto de cada notificação recebida, válida ou não.
- RLS: convidado vê disponibilidade sem identidade; anfitrião vê quem reservou/pagou
  e o valor; pagamentos são ilegíveis para quem não administra o evento.
- Painel do anfitrião mostra total de presentes, quantos foram presenteados e valor
  arrecadado (só pagamentos confirmados).
- Substituir a fixture de `GET /api/eventos/[slug]/presentes` por dados reais.

**Non-Goals:**

- Integração real com um provedor de pagamento específico (Stripe, Mercado Pago,
  PagSeguro, ...). Nenhuma decisão de provedor está tomada em `proposal.md`/specs, e
  não existe convenção de SDK de pagamento neste repositório. Ver decisão "Provedor
  de pagamento" abaixo.
- Emissão de nota fiscal, split de pagamento entre organização e plataforma, ou
  qualquer lógica de comissão.
- Job assíncrono (cron/queue) para expirar reservas em lote — a expiração é lida
  sob demanda (lazy) no momento em que a linha é tocada de novo.
- E-mail de recibo (fica para `add-transactional-emails`).

## Decisions

### 1. Dinheiro em centavos (`integer`), não `numeric`

`gifts.price_cents`, `quota_target_cents`, `quota_raised_cents`,
`quota_reserved_cents`, `payments.amount_cents` são `integer` (centavos). O tipo de
domínio `Gift.price`/`quota` em `src/lib/types.ts` continua em reais (`number`); a
conversão centavos ⇄ reais acontece só em `src/lib/db/mappers.ts`, no mesmo lugar que
já traduz `snake_case` ⇄ `camelCase`.

Alternativa descartada: `numeric(12,2)`. O client do Supabase serializa `numeric`
como `string` em JSON (para não perder precisão), o que forçaria todo consumidor a
fazer `Number(...)` manualmente e criaria uma segunda fonte de erro de arredondamento
em código que lida com dinheiro real. `integer` em centavos é aritmética exata,
comparável e soma sem arredondamento — pelo preço de uma conversão só na borda.

### 2. Reserva e cota compartilham a tabela `gifts`, mas fluxos diferentes

Um presente simples (`quota_target_cents is null`) segue
`disponivel → reservado → comprado`, com uma linha em `gift_reservations` (quem, até
quando). Um presente de cota nunca fica `reservado` — várias pessoas contribuem ao
mesmo tempo; ele vai direto de `disponivel` para `comprado` quando
`quota_raised_cents` atinge `quota_target_cents`. As duas famílias de regra
(`Requirement: Reserva de presente com expiração` e `Requirement: Presente de
cota`) são tratadas por funções SQL diferentes (`start_gift_checkout` ramifica no
início) mas escrevem no mesmo `payments`, então a confirmação/reembolso é um único
caminho de código.

### 3. `quota_reserved_cents`: o valor "em voo" evita ultrapassar a meta

Cenário da spec: duas contribuições simultâneas não podem, juntas, ultrapassar a
meta, e uma contribuição isolada acima do restante é recusada avisando o valor
máximo. Validar `amount <= target - raised` no momento do checkout não basta: dois
checkouts concorrentes veem o mesmo `raised` (nenhum dos dois foi confirmado ainda) e
os dois passariam, mesmo que a soma estoure a meta.

A correção: ao criar o checkout de uma contribuição, a função tranca a linha do
presente (`select ... for update`) e verifica `amount <= target - raised - reserved`;
se passar, soma `amount` a `quota_reserved_cents` antes de soltar o lock. Isso torna
a segunda tentativa concorrente ver o valor já comprometido pela primeira. Na
confirmação (webhook), o valor sai de `reserved` e entra em `raised`; na falha,
expiração ou reembolso, sai de `reserved`/`raised` e volta a ficar disponível. Sem
isso o sistema teria uma janela de corrida real entre "iniciar checkout" e
"confirmar pagamento" — minutos, não milissegundos, tempo mais que suficiente para
duas pessoas pagarem a mesma última cota.

### 4. Expiração de reserva é lida sob demanda, não por job

Uma reserva expirada só precisa "acontecer" no instante em que alguém tenta usar o
presente de novo (nova tentativa de reserva) ou em que o anfitrião lista o catálogo.
`start_gift_checkout` verifica, sob o mesmo lock, se a reserva ativa do presente já
passou de `expires_at`; se sim, marca-a `expirada`, devolve o presente a `disponivel`
e segue para reservar em nome de quem chamou. Isso evita depender de `pg_cron` (não
garantido em todo ambiente Supabase local) e resolve exatamente o cenário da spec
("reserva atinge o prazo... presente volta a disponível... pode ser reservado por
outro"). Trade-off aceito: um presente com reserva expirada e **nenhuma** nova
tentativa continua marcado `reservado` até alguém tentar de novo — inofensivo, porque
o catálogo público já filtra por essa mesma lógica de leitura (a rota de listagem
também expira preguiçosamente antes de devolver os dados).

### 5. Capacidade em vez de posse: convidado nunca tem linha em `profiles`

Convidado não tem conta (decisão herdada da fundação). `start_gift_checkout`,
`attach_checkout_session` e `get_payment_status` são `security definer`, com grant de
`execute` para `anon`/`authenticated`, e devolvem/recebem o `payment_id` (`uuid`) como
capability — o mesmo padrão que `guest_invites.token` já usa para o RSVP. Ninguém lê
`payments` por scan (RLS bloqueia `anon` por completo), só quem tem o `uuid` exato
consegue perguntar o estado — suficiente para a tela de sucesso, insuficiente para
enumerar pagamentos de outros convidados.

### 6. Webhook: `service_role`, nunca `security definer` acessível por `anon`

A confirmação de pagamento muda dinheiro de estado — se fosse uma função
`security definer` com `grant execute to anon`, qualquer requisição forjada poderia
"confirmar" um pagamento sem nunca ter pago. Por isso `process_payment_event` só tem
`grant execute to service_role`; a rota `POST /api/pagamentos/webhook` é o único
lugar do projeto, fora do módulo de dados, autorizado a instanciar
`createSupabaseAdminClient()` para chamar essa função — e só depois de validar a
assinatura HMAC do corpo bruto da requisição. Isso segue à risca a orientação do
projeto: client de serviço isolado no ponto de uso, com a justificativa ao lado.

### 7. Provedor de pagamento: interface própria, implementação mock local

Nem `proposal.md` nem as specs fixam Stripe, Mercado Pago, PagSeguro ou outro
provedor, e o repositório não tem nenhuma convenção de SDK de pagamento hoje.
Inventar uma integração real seria adivinhar uma decisão de produto (taxas, Pix
nativo vs. cartão, país de operação) que não está tomada.

Decisão: `src/lib/payments/provider.ts` define uma interface mínima,
provider-agnóstica:

```ts
interface PaymentProvider {
  createCheckoutSession(input: {
    paymentId: string;
    amountCents: number;
    currency: string;
    description: string;
  }): Promise<{ providerPaymentId: string; checkoutUrl: string }>;
}
```

`src/lib/payments/mockProvider.ts` implementa essa interface sem nenhuma chamada de
rede: gera um `providerPaymentId` determinístico e uma `checkoutUrl` apontando para
`/e/[slug]/presentes` com um parâmetro de simulação, o suficiente para exercitar o
fluxo completo (criar checkout → "pagar" → webhook → confirmado) em
local/desenvolvimento e nos testes de integração, sem depender de rede nem de
credencial real.

Escolha de assinatura do webhook: **HMAC-SHA256 sobre o corpo bruto**, no cabeçalho
`x-webhook-signature: sha256=<hex>`, chave em `PAYMENT_WEBHOOK_SECRET` — o desenho
mais comum entre provedores reais (Stripe, Mercado Pago, PagSeguro todos assinam o
corpo bruto com HMAC), então o adaptador de um provedor real, quando entrar, troca a
verificação por `crypto.timingSafeEqual` contra o formato do provedor específico sem
mudar o contrato interno (`payment_events`, `process_payment_event`).

Payload aceito pelo webhook (documentado aqui porque não existe outro lugar que fixe
o contrato):

```json
{
  "id": "evt_...",
  "provider": "mock",
  "type": "aprovado" | "recusado" | "reembolsado",
  "data": {
    "payment_id": "<uuid interno devolvido no checkout>",
    "provider_payment_id": "<id do provedor>",
    "amount_cents": 42000
  }
}
```

`id` é o identificador de evento do provedor — chave de deduplicação em
`payment_events (provider, provider_event_id)`, junto com `provider` (hoje sempre
`"mock"`; um provedor real usaria seu próprio nome, e o contrato já reserva o campo
para isso). `data.payment_id` é o nosso `uuid`, devolvido a quem criou o checkout; é
assim que o webhook encontra a linha sem depender de `provider_payment_id` já ter
sido persistido a tempo.

**Isso é uma decisão de design, não uma feature pronta para produção**: credenciais
reais, o adaptador de um provedor específico e o mapeamento do payload real desse
provedor para este contrato são trabalho manual de quem for integrar o provedor
escolhido — ver "Riscos" e o relatório final desta implementação.

### 8. Credenciais de pagamento: schema de env dedicado, carregado só pelo módulo de pagamentos

`src/lib/env.ts` (`serverEnv`) já falha a inicialização nomeando a variável que
falta — mas ele é importado por quase toda rota do projeto (via
`src/lib/supabase/admin.ts`), então acoplar as credenciais de pagamento ali faria
qualquer rota não relacionada a presentes quebrar sem a chave configurada.

`src/lib/payments/env.ts` replica o mesmo padrão (`zod`, `formatEnvIssues`,
parse eager no import) mas como módulo próprio, importado só por
`src/lib/payments/*.ts` e pelas rotas de checkout/webhook. `PAYMENT_WEBHOOK_SECRET`
é obrigatória (usada pela verificação de assinatura); `PAYMENT_PROVIDER_SECRET_KEY`
e `PAYMENT_PROVIDER_PUBLIC_KEY` existem no schema para quando um provedor real
entrar, mas o `mockProvider` não as lê — ficam documentadas e validadas (formato,
não vazias) para que trocar de mock para real não exija tocar em validação de env de
novo, só na implementação de `PaymentProvider`.

Novas variáveis de ambiente (todas em `.env.example`, sem valor real):

- `PAYMENT_WEBHOOK_SECRET` — segredo HMAC usado para validar a assinatura do
  webhook. Teste em local/staging, real em produção.
- `PAYMENT_PROVIDER_SECRET_KEY` — chave privada do provedor (não lida pelo mock;
  reservada para a implementação real).
- `PAYMENT_PROVIDER_PUBLIC_KEY` — chave pública, se o checkout hospedado precisar
  dela no cliente.

### 9. Painel do anfitrião: um endpoint de resumo, não uma tela nova completa

O proposal pede "acompanhamento do que foi presenteado e do total arrecadado" no
painel. Em vez de reconstruir `/painel` inteiro, `PainelOverview` ganha uma seção de
resumo de presentes (contagem + total arrecadado) alimentada por
`GET /api/eventos/[slug]/presentes/resumo`, que só quem administra o evento pode
chamar (a RLS de `gifts`/`payments` já resolve isso — o endpoint só soma o que a
consulta devolve). A visão detalhada "quem presenteou o quê" usa o mesmo
`GET /api/eventos/[slug]/presentes` com o parâmetro de administrador ligado
(a rota devolve `reservedBy`/comprador quando quem chama administra o evento, e
omite quando é o público — ver RLS de `gifts` abaixo, que expõe status mas não
identidade a `anon`).

## Schema SQL (resumo — migrations têm o texto completo)

```sql
create type public.gift_status as enum ('disponivel', 'reservado', 'comprado');
create type public.reservation_status as enum ('ativa', 'expirada', 'concluida', 'cancelada');
create type public.payment_status as enum ('pendente', 'pago', 'falho', 'reembolsado');

create table public.gifts (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references public.events (id) on delete cascade,
  name                  text not null,
  category              text not null,
  price_cents           integer not null check (price_cents > 0),
  store                 text,
  note                  text,
  status                public.gift_status not null default 'disponivel',
  quota_target_cents    integer check (quota_target_cents is null or quota_target_cents > 0),
  quota_raised_cents    integer not null default 0 check (quota_raised_cents >= 0),
  quota_reserved_cents  integer not null default 0 check (quota_reserved_cents >= 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table public.gift_reservations (
  id           uuid primary key default gen_random_uuid(),
  gift_id      uuid not null references public.gifts (id) on delete cascade,
  event_id     uuid not null references public.events (id) on delete cascade,
  guest_id     uuid references public.guests (id) on delete set null,
  buyer_name   text not null,
  buyer_email  text,
  status       public.reservation_status not null default 'ativa',
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
-- no máximo uma reserva ativa por presente
create unique index gift_reservations_active_idx
  on public.gift_reservations (gift_id) where status = 'ativa';

create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references public.events (id) on delete cascade,
  gift_id             uuid not null references public.gifts (id) on delete cascade,
  reservation_id      uuid references public.gift_reservations (id) on delete set null,
  buyer_name          text not null,
  buyer_email         text,
  amount_cents        integer not null check (amount_cents > 0),
  currency            text not null default 'BRL',
  provider            text not null default 'mock',
  provider_payment_id text,
  status              public.payment_status not null default 'pendente',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  confirmed_at        timestamptz,
  refunded_at         timestamptz,
  unique (provider, provider_payment_id)
);

create table public.payment_events (
  id                  uuid primary key default gen_random_uuid(),
  payment_id          uuid references public.payments (id) on delete set null,
  provider            text not null,
  provider_event_id   text,
  event_type          text not null,
  payload             jsonb not null,
  signature_valid     boolean not null,
  received_at         timestamptz not null default now(),
  processed_at        timestamptz,
  unique (provider, provider_event_id)
);
```

RLS (resumo — ver migration `..._rls_gifts_payments.sql` para o texto completo):

- `gifts`: `select` para `anon, authenticated` quando `is_event_public(event_id)`;
  `insert/update/delete` para `authenticated` quando `can_manage_event(event_id)`.
  Sem coluna de identidade de comprador — seguro expor a linha inteira ao público.
- `gift_reservations`: `select` só para `authenticated` com
  `can_manage_event(event_id)`. Nenhum grant de escrita para `anon`/`authenticated`
  — toda escrita passa pelas funções `security definer`.
- `payments`: `select` só para `authenticated` com `can_manage_event(event_id)`.
  Nenhum grant a `anon`. Escrita só via função `security definer` (criação) ou
  `service_role` (confirmação/estorno pelo webhook).
- `payment_events`: `select` só para `authenticated` cujo `payment_id` aponta para
  um pagamento de evento que administra. Escrita só por `service_role`.

Funções (`security definer`, `search_path = ''`, mesmo padrão de
`20260803130400_guest_functions.sql`):

- `start_gift_checkout(p_event_slug, p_gift_id, p_amount_cents, p_buyer_name,
  p_buyer_email)` — grant a `anon, authenticated`. Bifurca presente simples vs. cota,
  tranca a linha do presente, cria reserva (se simples) e a linha de `payments`.
  Erros de domínio via `raise exception '<código>' using errcode = 'P0001'` — mesmo
  padrão de `RsvpError`/`toRsvpError`, mapeado por
  `src/lib/db/errors.ts` (`GiftCheckoutError`).
- `attach_checkout_session(p_payment_id, p_provider, p_provider_payment_id)` — grant
  a `anon, authenticated`. Só atualiza um `payments` `pendente` sem
  `provider_payment_id` ainda — o `uuid` do pagamento é a capability.
- `get_payment_status(p_payment_id)` — grant a `anon, authenticated`. Devolve estado
  do pagamento e do presente para a tela de sucesso, sem identidade de terceiros.
- `process_payment_event(p_payment_id, p_provider_payment_id, p_event_type,
  p_amount_cents)` — grant **só a `service_role`**. Efetiva aprovação, recusa ou
  reembolso; idempotente por guarda de estado (`status <> 'pendente'` ⇒ no-op para
  aprovação/recusa; `status <> 'pago'` ⇒ no-op para reembolso).

## Risks / Trade-offs

- **[Risco] Nenhum provedor de pagamento real integrado.** → Mitigado
  explicitamente pelo design: interface `PaymentProvider` isolada, mock local para
  todo o ciclo de desenvolvimento/teste, decisão registrada aqui. Trocar o mock por
  Stripe/Mercado Pago/PagSeguro é trabalho humano de configuração de credencial +
  implementação de um novo `PaymentProvider`, não uma reescrita de schema ou RLS.
- **[Risco] Corrida entre duas confirmações de webhook para o mesmo pagamento.** →
  `process_payment_event` tranca a linha de `payments` (`select ... for update`)
  antes de decidir; a segunda chamada vê o estado já mudado pela primeira e vira
  no-op.
- **[Risco] Eventos de webhook fora de ordem (recusa chega depois da aprovação, ou
  vice-versa, por retry de rede).** → Mitigado até onde a guarda de estado permite:
  uma vez em estado terminal (`pago`/`falho`/`reembolsado`), eventos que exigem
  `pendente` (aprovação/recusa) ou `pago` (reembolso) como pré-condição são no-op.
  Não mitigado: se dois eventos que competem pela **mesma** pré-condição chegam fora
  de ordem cronológica (ex.: "recusado" processado antes de um "aprovado" mais
  antigo que ainda está em trânsito), o último a chegar vence, não o mais recente
  por timestamp do provedor. Aceito como resultado minimamente correto — provedores
  reais raramente entregam webhooks fora de ordem para o mesmo pagamento — e
  registrado aqui em vez de resolvido com ordenação por timestamp, que exigiria o
  provedor real garantir um relógio confiável no payload.
- **[Risco] `gift_reservations_active_idx` (índice único parcial) não pode ser alvo
  de `.upsert(onConflict:)` do PostgREST.** → Não é um problema aqui porque nenhuma
  escrita em `gift_reservations` passa pelo client JS diretamente — tudo acontece
  dentro de `start_gift_checkout`, em SQL puro, com `select ... for update` explícito
  em vez de `insert ... on conflict`. Documentado para não ser reintroduzido por
  engano numa iteração futura.
- **[Trade-off] Expiração de reserva é lazy, não por cron.** → Ver decisão 4. Um
  presente com reserva vencida e sem nenhuma nova tentativa de reserva/listagem
  fica com o rótulo `reservado` "preso" até a próxima leitura relevante — não afeta
  correção (a próxima tentativa sempre revalida), só a atualidade de um contador
  não consultado.
- **[Risco] Segredo do webhook exposto por engano em log.** → `PAYMENT_WEBHOOK_SECRET`
  segue a mesma disciplina de `.env` do resto do projeto (nunca hardcoded, nunca
  logado); a rota do webhook loga apenas `signature_valid` (booleano) e o `id` do
  evento, nunca o corpo bruto nem o cabeçalho de assinatura.

## Migration Plan

1. Enums (`gift_status`, `reservation_status`, `payment_status`).
2. Tabelas `gifts`, `gift_reservations`, `payments`, `payment_events` (cada uma sua
   migration, mesmo padrão do módulo de convidados).
3. Funções `security definer` de checkout/status (grant `anon, authenticated`) e
   `process_payment_event` (grant só `service_role`).
4. RLS + grants (incluindo o grant explícito a `service_role` para as 4 tabelas
   novas — a migration de fundação só alcança tabelas que já existiam).
5. `supabase db reset` local + `npm run db:types` depois de cada migration que muda
   schema (não só no fim), para pegar erro cedo.
6. Sem dado a migrar de produção: é feature nova, não há linha existente de
   presentes/pagamentos. Rollback é `supabase db reset` para o estado anterior do
   diretório de migrations (ambiente local/staging); em produção, uma migration de
   `drop table` explícita se o change precisar ser revertido — não coberta aqui
   porque este projeto ainda não tem produção implantada.
