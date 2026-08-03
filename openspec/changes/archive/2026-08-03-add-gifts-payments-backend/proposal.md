## Why

`/e/[slug]/presentes` já tem lista, checkout e tela de sucesso — mas nada acontece:
o presente não é reservado, a cota não sobe e nenhum dinheiro muda de mãos. É o
único módulo que gera receita direta para o anfitrião, e é também o que mais expõe
o produto se for feito errado: dois convidados pagando o mesmo presente, ou uma cota
que ultrapassa a meta.

## What Changes

- Cria a lista de presentes por evento, com nome, categoria, preço, loja e
  observação, e o estado disponível, reservado ou comprado.
- Cria presentes de cota: um item caro dividido entre vários convidados, com meta e
  valor arrecadado.
- Persiste a reserva de presente com expiração, para que um item reservado e não
  pago volte a ficar disponível.
- Integra pagamento real: checkout hospedado pelo provedor, confirmação por webhook
  assinado, e o presente só é marcado como comprado depois da confirmação.
- Trata reembolso e estorno revertendo o estado do presente ou da cota.
- Substitui o mock de `GET /api/eventos/[slug]/presentes` por dados reais e adiciona
  as rotas de reserva, checkout e webhook.
- Adiciona ao painel do anfitrião o acompanhamento do que foi presenteado e do total
  arrecadado.

## Capabilities

### New Capabilities

- `presentes`: catálogo de presentes por evento, cotas, reserva com expiração,
  estados e visão de acompanhamento do anfitrião.
- `pagamentos`: checkout, confirmação por webhook, idempotência, reembolso e
  conciliação entre pagamento e presente.

### Modified Capabilities

Nenhuma.

## Impact

- **Depende de**: `add-supabase-foundation`. Usa a identificação por token de
  convite de `add-guests-rsvp-backend` quando o comprador é um convidado conhecido,
  mas funciona sem ela.
- **Novas dependências**: SDK do provedor de pagamento.
- **Novas variáveis de ambiente**: chave secreta do provedor, chave pública, segredo
  de verificação do webhook — todas por ambiente, com credenciais de teste em local e
  staging.
- **Novas tabelas**: `gifts`, `gift_reservations`, `payments`, `payment_events`.
- **Rotas afetadas**: `GET /api/eventos/[slug]/presentes`; novas rotas de reserva,
  criação de checkout e recebimento de webhook.
- **Telas afetadas**: `/e/[slug]/presentes` (lista, checkout, sucesso), `/painel`,
  `/painel/editor` (curadoria da lista).
- **Riscos**: dinheiro real. Duas transações concorrentes no mesmo presente, webhook
  reentregue e checkout abandonado precisam de tratamento explícito.
