## Why

O backend do catálogo de presentes já existe (`POST/PATCH/DELETE /api/eventos/[slug]/presentes[/[giftId]]`), mas o anfitrião não tem nenhuma tela para usá-lo: o painel só liga/desliga o módulo em `/painel/editor` e mostra números em `/painel` (Visão geral). Hoje só dá para cadastrar presente chamando a API na mão, então na prática a lista de presentes é inutilizável pelo cliente.

## What Changes

- Nova tela **`/painel/presentes`** (item novo na navegação do painel, em `src/app/painel/layout.tsx`) para o anfitrião gerenciar o catálogo do seu evento.
- A tela permite **cadastrar, editar e remover** presentes (nome, categoria, preço, loja e observação opcionais) e criar **presente de cota** informando a meta.
- A tela mostra o **estado de cada presente** (disponível / reservado / comprado), o valor arrecadado das cotas e **quem reservou ou pagou** (`reservedBy`), já devolvido por `listGifts`.
- Reaproveita as rotas de API e validações existentes (`createGiftSchema` / `updateGiftSchema` em `src/lib/validation/gift.ts`); **nenhuma mudança de banco, RLS ou contrato de API**.
- O card "Presentes" da Visão geral (`PainelOverview.tsx`) passa a apontar para `/painel/presentes` em vez da página pública `/e/[slug]/presentes`.

## Capabilities

### New Capabilities
- (nenhuma)

### Modified Capabilities
- `presentes`: os requisitos "Catálogo de presentes do evento" e "Visibilidade do estado do presente" hoje descrevem o comportamento só no nível de API/RLS. A mudança adiciona cenários exigindo que esse cadastro e essa visão de "quem presenteou" estejam disponíveis ao anfitrião numa tela do painel (`/painel/presentes`), não apenas via chamada direta de API.

## Impact

- **Código novo**: `src/app/painel/presentes/page.tsx` (server component) + `src/app/painel/presentes/GiftManager.tsx` (client component).
- **Código alterado**: `src/app/painel/layout.tsx` (novo item de nav), `src/app/painel/PainelOverview.tsx` (destino do card "Presentes").
- **Reaproveitado sem alteração**: `src/app/api/eventos/[slug]/presentes/route.ts`, `src/app/api/eventos/[slug]/presentes/[giftId]/route.ts`, `src/lib/db/gifts.ts`, `src/lib/validation/gift.ts`, tipo `Gift` em `src/lib/types.ts`.
- **Sem impacto**: banco, migrations, RLS, pagamentos, e-mails, página pública de presentes.
- **Testes**: `tests/gifts.test.mjs` continua cobrindo a API; a tela é coberta pelo fluxo manual descrito nas tasks.
