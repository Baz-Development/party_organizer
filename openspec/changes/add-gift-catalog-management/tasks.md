## 1. Navegação do painel

- [x] 1.1 Adicionar item `{ href: "/painel/presentes", label: "Presentes" }` em `ITEMS` de `src/app/painel/layout.tsx`, entre "Convidados" e "Editor da página"
- [x] 1.2 Em `src/app/painel/PainelOverview.tsx`, trocar o `href` do card "Presentes" de `eventUrl(event, "/presentes")` para `/painel/presentes`

## 2. Rota server da tela

- [x] 2.1 Criar `src/app/painel/presentes/page.tsx` seguindo o padrão de `src/app/painel/convidados/page.tsx`: `requireSession("/painel/presentes")`, `listEvents({ hostProfileId: user.id })`, `redirect("/painel")` se não houver evento, `metadata` com título "Presentes — Convite"
- [x] 2.2 Renderizar `<GiftManager event={event} />`

## 3. Client GiftManager — leitura

- [x] 3.1 Criar `src/app/painel/presentes/GiftManager.tsx` (client component) que recebe `event: EventSummary`
- [x] 3.2 Carregar o catálogo via `GET /api/eventos/${event.slug}/presentes` no mount; expor função `reload()` reutilizável
- [x] 3.3 Recarregar ao voltar o foco para a aba (`visibilitychange`/`focus`)
- [x] 3.4 Listar cada presente com nome, categoria, preço (`brl`), loja/observação, badge de estado (disponível/reservado/comprado), progresso da cota (`quota.raised`/`quota.target`) e `reservedBy` quando presente
- [x] 3.5 Centralizar o mapa de rótulos de estado num objeto local no arquivo (sem tocar no componente público)
- [x] 3.6 Estados de lista vazia e carregando

## 4. Client GiftManager — criar

- [x] 4.1 Formulário de novo presente: nome, categoria, preço (reais, `inputMode="numeric"`), loja (opcional), observação (opcional)
- [x] 4.2 Checkbox "presente de cota" que revela o campo de meta (reais); quando marcado, enviar `quotaTarget`
- [x] 4.3 `POST /api/eventos/${event.slug}/presentes` com o corpo em reais (a rota converte); em 201, limpar o formulário e `reload()`
- [x] 4.4 Exibir a mensagem de `error` das respostas 400/403

## 5. Client GiftManager — editar e remover

- [x] 5.1 Edição inline de um presente: nome, categoria, preço, loja, observação (sem meta de cota — fora de escopo)
- [x] 5.2 `PATCH /api/eventos/${event.slug}/presentes/${giftId}`; em 200, sair do modo edição e `reload()`
- [x] 5.3 Remover presente com confirmação; `DELETE /api/eventos/${event.slug}/presentes/${giftId}`; em 204, `reload()`
- [x] 5.4 Exibir `error` das respostas 400/403/404 por presente

## 6. Verificação

- [ ] 6.1 Consultar `node_modules/next/dist/docs/` sobre client components e data fetching antes de finalizar
- [x] 6.2 `npm run lint` e `npm run build` sem erros
- [x] 6.3 `node --test tests/gifts.test.mjs` continua verde (nenhuma regressão de API)
- [ ] 6.4 Fluxo manual com Supabase local: logar como anfitrião, criar presente simples, criar presente de cota, editar, remover; abrir `/e/[slug]/presentes` e confirmar que reflete; logar como outro anfitrião e confirmar que não vê o catálogo alheio
- [x] 6.5 Rodar `openspec validate add-gift-catalog-management --strict`
