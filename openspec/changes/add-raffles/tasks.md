## 1. Banco — migrations

- [x] 1.1 `20261019120000_module_id_sorteios.sql`: valor `sorteios` em `module_id` (sozinho na migration)
- [x] 1.2 `20261019120100_raffles.sql`: enums, tabelas `raffles`, `raffle_prizes`, `raffle_participants`, `raffle_results`, índices e triggers de `updated_at`
- [x] 1.3 Trigger `_raffle_guard_config` (congelamento + `event_id` do sorteio + convidado do mesmo evento) e `_raffle_guard_alternates`
- [x] 1.4 `20261019120200_raffle_functions.sql`: `start_raffle`, `reopen_raffle`, `reset_raffle`, `finish_raffle`, `draw_raffle_winner`, `mark_raffle_result_absent`

## 2. Banco — RLS

- [x] 2.1 `20261019120300_rls_raffles.sql`: políticas por `can_manage_event`, grants por coluna em `raffles`, sem escrita em `raffle_results`, grants de `service_role`

## 3. Camada de dados e API

- [x] 3.1 Tipos de domínio (`Raffle`, `RafflePrize`, `RaffleParticipant`, `RaffleResult`, `RaffleSummary`) em `src/lib/types.ts` e tipos gerados em `src/lib/database.types.ts`
- [x] 3.2 `RaffleError`/`toRaffleError` em `src/lib/db/errors.ts`
- [x] 3.3 `src/lib/validation/raffle.ts`
- [x] 3.4 `src/lib/db/raffles.ts` (listar, detalhe com URL assinada das fotos, CRUD, participantes em lote, ações, sortear, ausente)
- [x] 3.5 Rotas `/api/eventos/[slug]/sorteios/**` com 404 para evento invisível e 403 para módulo desligado
- [x] 3.6 Módulo `sorteios` em `MODULE_IDS`, `MODULE_ORDER` e nas opções do editor

## 4. Painel

- [x] 4.1 Item "Sorteios" na navegação e atalho na visão geral, só com o módulo ligado
- [x] 4.2 `/painel/sorteios`: lista e criação
- [x] 4.3 `/painel/sorteios/[id]`: prêmios (com foto, quantidade, ordem), suplentes, participantes da lista de convidados, banner de bloqueio com reabrir/recomeçar, resultados
- [x] 4.4 Upload de imagem extraído para `src/lib/upload-event-image.ts` (presentes e prêmios)

## 5. Palco

- [x] 5.1 `/palco`: abertura com carrossel 3D de prêmios e botão "Começar" (bloqueia inscrições)
- [x] 5.2 Urna 3D com aceleração/desaceleração até o vencedor decidido pelo servidor
- [x] 5.3 Revelação com cartão 3D, confete e fanfarra; "Não está presente?"
- [x] 5.4 Quadro final de ganhadores e suplentes
- [x] 5.5 Som (mudo), tela cheia, atalhos de teclado, `prefers-reduced-motion`, layout de celular

## 5b. Modo de participação

- [x] 5b.1 Migration `20261019130000_raffle_participant_mode.sql`: enum, coluna, grants, trava fora de `aberto`, `_raffle_sync_participants` e `start_raffle` sincronizando antes de bloquear
- [x] 5b.2 Tipo `RaffleParticipantMode`, `participantMode` na API (`PATCH`), prévia de `participantCount` nos modos automáticos
- [x] 5b.3 Seletor "Todos os convidados / Só os confirmados / Escolher na lista" no passo 2 do editor, com prévia de quem participa
- [x] 5b.4 Palco recarrega o sorteio depois de "Começar" (a urna é montada pelo banco)
- [x] 5b.5 Testes: todos (inclui cadastrado depois de escolher o modo, exclui cadastrado depois de começar), confirmados, sem elegíveis, modo travado, autorização

## 6. Testes e verificação

- [x] 6.1 `tests/raffles.test.mjs`: autorização, bloqueio, ordem das vagas, concorrência, urna vazia, ausente, recomeçar, módulo desligado, convidado removido
- [ ] 6.2 Rodar `npm run db:reset && npm test` com o Supabase local
- [ ] 6.3 Regenerar `src/lib/database.types.ts` com `npm run db:types` e conferir que não há diferença relevante
- [ ] 6.4 Ensaio manual ponta a ponta no painel com um evento real (criar sorteio → selecionar convidados → palco → ausente → recomeçar)
