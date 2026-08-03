## 1. Migrations — schema

- [x] 1.1 `supabase/migrations/..._gifts_payments_enums.sql`: `gift_status`,
      `reservation_status`, `payment_status`.
- [x] 1.2 `supabase/migrations/..._gifts.sql`: tabela `gifts` (preço em centavos,
      cota opcional, `touch_updated_at` trigger), índice por `event_id`.
- [x] 1.3 `supabase/migrations/..._gift_reservations.sql`: tabela
      `gift_reservations` + índice único parcial de reserva ativa por presente.
- [x] 1.4 `supabase/migrations/..._payments.sql`: tabela `payments`
      (`touch_updated_at` trigger), unique `(provider, provider_payment_id)`.
- [x] 1.5 `supabase/migrations/..._payment_events.sql`: tabela `payment_events`,
      unique `(provider, provider_event_id)`.
- [x] 1.6 Rodar `npx --no-install supabase db reset` e `npm run db:types`; conferir
      que `src/lib/database.types.ts` ganhou as 4 tabelas novas.

## 2. Migrations — funções de checkout e pagamento

- [x] 2.1 `supabase/migrations/..._gift_checkout_functions.sql`:
      `start_gift_checkout` (bifurca presente simples/cota, lock, expira reserva
      vencida, cria `gift_reservations`/`payments`), `attach_checkout_session`,
      `get_payment_status`. Grant `execute` a `anon, authenticated`.
- [x] 2.2 `supabase/migrations/..._payment_webhook_function.sql`:
      `process_payment_event` (aprovação/recusa/reembolso, guarda de estado para
      idempotência, ajuste de `quota_reserved_cents`/`quota_raised_cents`). Grant
      `execute` só a `service_role`.
- [x] 2.3 Rodar `npx --no-install supabase db reset` e `npm run db:types` de novo.

## 3. Migrations — RLS e grants

- [x] 3.1 `supabase/migrations/..._rls_gifts_payments.sql`: `enable row level
      security` nas 4 tabelas; políticas de `gifts` (select público de evento
      publicado, gestão por `can_manage_event`), `gift_reservations` (select só
      anfitrião), `payments` (select só anfitrião), `payment_events` (select só
      anfitrião via join em `payments`).
- [x] 3.2 Grants explícitos: `select` a `anon, authenticated` em `gifts` (mais
      `insert/update/delete` a `authenticated`); `select` a `authenticated` em
      `gift_reservations`/`payments`/`payment_events`; `grant all ... to
      service_role` nas 4 tabelas (a migration de fundação não alcança tabela
      criada depois).
- [x] 3.3 Rodar `npx --no-install supabase db reset` de novo e confirmar que
      `20260803121000_assert_rls_enabled.sql` não falha.

## 4. Camada de dados e validação

- [x] 4.1 `src/lib/db/mappers.ts`: `toGift` (centavos → reais, `quota` opcional),
      mapeamento de linha de `payments` para o que a rota de status precisa.
- [x] 4.2 `src/lib/db/gifts.ts`: `listGifts` (público, filtra por `is_event_public`
      via RLS), `listGifts` já traz a identidade embutida via join com `gift_reservations`, escopado pela RLS dessa tabela,
      `createGift`, `updateGift`, `deleteGift`, `giftsSummary` (contagem + total
      arrecadado, só pagamentos `pago`).
- [x] 4.3 `src/lib/db/payments.ts`: `startGiftCheckout` (chama `start_gift_checkout`
      via RPC), `attachCheckoutSession`, `getPaymentStatus`. Todas recebem o client
      do chamador (anônimo inclusive), nunca client de serviço.
- [x] 4.4 `src/lib/db/errors.ts`: `GiftCheckoutError` + mapa de código de domínio
      (`presente_indisponivel`, `presente_reservado`, `valor_invalido`,
      `valor_excede_restante:<centavos>`, `evento_indisponivel`), seguindo o padrão
      de `RsvpError`/`toRsvpError`.
- [x] 4.5 `src/lib/validation/gift.ts`: schemas Zod de criação/edição de presente
      (nome, categoria, preço > 0, cota opcional > 0) e de início de checkout
      (nome/e-mail do comprador, valor opcional para cota).

## 5. Módulo de pagamento (provedor + webhook)

- [x] 5.1 `src/lib/payments/env.ts`: schema Zod próprio (`PAYMENT_WEBHOOK_SECRET`
      obrigatória; `PAYMENT_PROVIDER_SECRET_KEY`/`PAYMENT_PROVIDER_PUBLIC_KEY`
      reservadas), parse eager, mensagem nomeando a variável faltante.
- [x] 5.2 `src/lib/payments/provider.ts`: interface `PaymentProvider`.
- [x] 5.3 `src/lib/payments/mockProvider.ts`: implementação local sem rede, usada
      em todo ambiente até um provedor real ser configurado.
- [x] 5.4 `src/lib/payments/webhookSignature.ts`: `verifyWebhookSignature(rawBody,
      header, secret)` — HMAC-SHA256, comparação em tempo constante
      (`crypto.timingSafeEqual`).
- [x] 5.5 `.env.example`: adicionar `PAYMENT_WEBHOOK_SECRET`,
      `PAYMENT_PROVIDER_SECRET_KEY`, `PAYMENT_PROVIDER_PUBLIC_KEY` (sem valor real).

## 6. Rotas de API

- [x] 6.1 `src/app/api/eventos/[slug]/presentes/route.ts`: substituir a fixture —
      `GET` lista presentes reais; se quem chama administra o evento, inclui
      identidade de quem reservou/comprou (a RLS de `gift_reservations` escopa), senão só
      disponibilidade; `POST` cria presente (só quem administra).
- [x] 6.2 `src/app/api/eventos/[slug]/presentes/[giftId]/route.ts`: `PATCH`/`DELETE`
      só quem administra.
- [x] 6.3 `src/app/api/eventos/[slug]/presentes/resumo/route.ts`: `GET` com
      contagem total/presenteados/valor arrecadado, só quem administra.
- [x] 6.4 `src/app/api/eventos/[slug]/presentes/[giftId]/checkout/route.ts`: `POST`
      — valida entrada, chama `startGiftCheckout`, chama o `PaymentProvider` para
      abrir a sessão, grava `attachCheckoutSession`, devolve `checkoutUrl` +
      `paymentId`. Nunca aceita valor do cliente para presente simples.
- [x] 6.5 `src/app/api/pagamentos/status/[paymentId]/route.ts`: `GET` — para a tela
      de sucesso perguntar se já confirmou, sem expor pagamentos de terceiros.
- [x] 6.6 `src/app/api/pagamentos/webhook/route.ts`: lê corpo bruto, verifica
      assinatura, insere `payment_events` (dedupe por `provider_event_id`), chama
      `process_payment_event` via `createSupabaseAdminClient()` isolado nesta rota.
      Assinatura ausente/inválida: 401, evento registrado como inválido, nenhum
      estado mudado.

## 7. UI

- [x] 7.1 `GiftList.tsx`: substituir `GIFTS` da fixture por dado real do
      `EventSummary`/fetch da rota; ligar o botão de confirmar ao
      `POST .../checkout`; tela de sucesso consulta `GET /api/pagamentos/status/...`
      e mostra "confirmação em processamento" enquanto `pendente`.
- [x] 7.2 `PainelOverview.tsx`: seção de resumo de presentes (contagem + total
      arrecadado) usando `GET /api/eventos/[slug]/presentes/resumo`.
- [x] 7.3 `src/app/painel/editor/EditorForm.tsx` / `actions.ts`: permitir
      habilitar/desabilitar o módulo `presentes`, mesmo padrão já usado para `rsvp`.
- [x] 7.4 Remover `src/lib/fixtures/gifts.ts` depois que nenhuma tela mais importar
      dele.

## 8. Testes

- [x] 8.1 `tests/gifts.test.mjs`: RLS de `gifts` (público só de evento publicado,
      sem identidade de comprador; gestão só de quem administra).
- [x] 8.2 `tests/gifts.test.mjs`: reserva concorrente — duas chamadas paralelas de
      `start_gift_checkout` no mesmo presente simples, exatamente uma ganha.
- [x] 8.3 `tests/gifts.test.mjs`: reserva expirada volta a `disponivel` e aceita
      nova reserva (via `admin` forçando `expires_at` no passado).
- [x] 8.4 `tests/gifts.test.mjs`: cota — contribuição acima do restante é recusada
      com o valor máximo; duas contribuições simultâneas dentro do restante somam
      exato sem ultrapassar a meta (via `Promise.all`).
- [x] 8.5 `tests/payments.test.mjs`: RLS de `payments`/`payment_events` — convidado
      não lê, organização de outro evento não lê.
- [x] 8.6 `tests/payments.test.mjs`: `process_payment_event` — aprovação confirma
      presente/cota; recusa libera reserva; reembolso reverte presente/cota;
      chamada duplicada do mesmo evento é no-op idempotente.
- [x] 8.7 `tests/webhook.test.mjs`: assinatura válida processa; assinatura
      ausente/inválida é descartada sem mudar estado e retorna 401; entrega
      duplicada (mesmo `provider_event_id`) é aceita sem reprocessar.

## 9. Fechamento

- [x] 9.1 `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — todos
      verdes.
- [x] 9.2 `npx openspec validate add-gifts-payments-backend --strict` sem erros.
- [x] 9.3 Marcar todas as caixas deste arquivo e arquivar o change.
