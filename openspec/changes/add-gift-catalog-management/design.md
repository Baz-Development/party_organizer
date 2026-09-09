## Context

O backend de presentes está completo: tabelas `gifts` / `gift_reservations` / `payments`
com RLS (`gifts_manage` restringe escrita a quem administra o evento), rotas
`GET/POST /api/eventos/[slug]/presentes` e `PATCH/DELETE /api/eventos/[slug]/presentes/[giftId]`,
validações em `src/lib/validation/gift.ts` e acesso em `src/lib/db/gifts.ts`
(`listGifts` já devolve `reservedBy` preenchido para quem administra).

Falta apenas a interface. O painel do anfitrião (`/painel`, `/painel/convidados`,
`/painel/editor`, `/painel/moderacao`) segue um padrão fixo: `page.tsx` server
component que resolve `requireSession` + `listEvents({ hostProfileId })`, pega
`events[0]`, redireciona para `/painel` se não houver evento, e renderiza um client
component (`GuestManager`, `ModerationQueue`) que conversa com a API por `fetch`.

## Goals / Non-Goals

**Goals:**
- Tela `/painel/presentes` para o anfitrião cadastrar, editar e remover presentes do seu evento.
- Suporte a presente de cota (meta de valor) no formulário de criação.
- Exibir estado (disponível/reservado/comprado), progresso da cota e `reservedBy` por presente.
- Reaproveitar 100% da API e validações existentes.

**Non-Goals:**
- Nenhuma mudança de banco, migration, RLS ou contrato de API.
- Upload de imagem do presente (a página pública usa `ImageSlot` placeholder; fica para depois).
- Edição de meta de cota após criado (o `updateGiftSchema` atual não cobre `quotaTarget`).
- Reordenar presentes, categorias como entidade, importação em massa.
- Qualquer mudança na página pública `/e/[slug]/presentes`.

## Decisions

### Seguir o padrão server `page.tsx` + client `GiftManager.tsx`

Igual a `convidados/`: `src/app/painel/presentes/page.tsx` faz `requireSession("/painel/presentes")`,
resolve o evento do anfitrião e redireciona para `/painel` se não houver. O client
`GiftManager` recebe `event: EventSummary` e faz `fetch` para as rotas existentes.
Alternativa considerada: Server Actions. Rejeitada porque toda a camada de painel
já fala com as rotas REST por `fetch` — manter consistência.

### Carga inicial via `GET /api/eventos/[slug]/presentes`

O mesmo endpoint que a página pública usa. Autenticado, ele devolve `reservedBy`
por causa da RLS de `gift_reservations`. Evita criar um `db/gifts` server-side novo
só para o painel.

### Formulário único para criar, com edição inline

Criar: nome, categoria, preço (reais), loja (opcional), observação (opcional) e um
checkbox "presente de cota" que revela o campo de meta. Editar: reusa os mesmos
campos exceto meta de cota (limitação do `updateGiftSchema`). Remover: confirmação
simples. Estados de erro vêm do `error` das respostas 400/403/404.

### Item de navegação novo

Adicionar `{ href: "/painel/presentes", label: "Presentes" }` em `ITEMS` de
`src/app/painel/layout.tsx`, entre "Convidados" e "Editor da página". O card
"Presentes" de `PainelOverview.tsx` passa a linkar `/painel/presentes`.

## Variáveis de ambiente

Nenhuma variável de ambiente nova.

## Schema e RLS

Nenhuma alteração de schema ou RLS. A tela opera sobre as tabelas e políticas já
existentes (`gifts`, `gift_reservations`, `payments`; política `gifts_manage` para
escrita, leitura pública de evento publicado). A autorização continua sendo
decidida pela RLS no Supabase — a tela apenas exibe os erros 403 devolvidos.

## Risks / Trade-offs

- **Meta de cota imutável após criação** → aceitável no MVP; abrir change depois para estender `updateGiftSchema` + `updateGift`.
- **Sem realtime**: se um convidado reservar durante a sessão do anfitrião, a tela não atualiza sozinha → `fetch` de recarga após cada mutação e ao focar a aba; suficiente para o volume esperado.
- **Divergência de rótulos de estado** entre painel e página pública (`Gift.status`: `disponivel`/`reservado`/`comprado`) → centralizar o mapa de rótulos no client do painel, sem tocar no componente público.

## Migration Plan

Deploy é só código (novas telas + 2 edições). Sem passo de banco. Rollback:
reverter o commit; as rotas de API e o backend seguem funcionando como antes.

## Open Questions

- O card da Visão geral deve manter também um atalho para a página pública, ou basta o link "Ver página pública" do layout? (Assumindo: basta o do layout.)
