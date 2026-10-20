## Why

Anfitriãs fazem sorteios de brindes durante a festa (lembrancinhas, kits de parceiros, o "grande prêmio" da noite), hoje com papelzinho ou um app genérico de sorteio aberto no celular. O sorteio vira um momento morto: o nome só aparece numa tela branca. A plataforma já tem a lista de convidados do evento e a identidade visual da festa — falta juntar as duas num sorteio configurável no painel e numa tela de apresentação teatral, que a anfitriã projeta ou compartilha sem precisar de treinamento.

## What Changes

- Novo módulo **`sorteios`** (liga/desliga em `/painel/editor`, como os demais). Só existe no painel — não tem seção na página pública.
- Nova tela **`/painel/sorteios`**: lista dos sorteios do evento e criação de um sorteio novo (um evento pode ter vários).
- Nova tela **`/painel/sorteios/[id]`** em três passos:
  1. **Prêmios** — cadastrar, editar, remover e reordenar prêmios (nome, detalhes, foto opcional e **quantos vencedores** cada prêmio tem). A ordem da lista é a ordem do sorteio no palco. Define também quantos **suplentes** serão sorteados ao final.
  2. **Participantes** — marcar na lista de convidados quem concorre (filtros por status de RSVP, busca, marcar todos).
  3. **Apresentar** — abrir a tela do sorteio.
  Mostra os resultados e permite **reabrir as inscrições** (antes do primeiro nome sorteado) ou **recomeçar do zero** (descarta resultados).
- Nova tela **`/painel/sorteios/[id]/palco`**: apresentação em tela cheia, fundo preto luxo com feixes de luz e poeira dourada, urna 3D de nomes girando, rufar e "tic-tic" sintetizados, revelação com cartão girando em 3D e confete dourado, quadro final de ganhadores. Um único botão grande por momento (Começar → Sortear → Próximo), que também responde à barra de espaço.
- **Começar o sorteio bloqueia a lista de participantes** (e prêmios/suplentes) — ninguém entra ou sai da urna depois disso.
- O vencedor é escolhido **pelo banco**, de forma atômica e com aleatoriedade criptográfica; a tela só anima até o nome decidido. Recarregar o palco não perde resultado.
- "**Não está presente?**" marca o sorteado como ausente: a vaga do prêmio volta e o nome sai da urna.
- Novas rotas de API em `/api/eventos/[slug]/sorteios/**` (CRUD do sorteio e dos prêmios, participantes, transições de estado, sortear, marcar ausente).

## Capabilities

### New Capabilities
- `sorteios`: sorteio de prêmios entre convidados selecionados, com configuração de prêmios/vencedores/suplentes, bloqueio de inscrições ao começar, escolha do vencedor no servidor e tela de apresentação.

### Modified Capabilities
- (nenhuma — `eventos` só ganha um valor novo de módulo, sem mudar requisito)

## Impact

- **Banco**: valor `sorteios` em `module_id`; tabelas `raffles`, `raffle_prizes`, `raffle_participants`, `raffle_results`; funções `start_raffle`, `reopen_raffle`, `reset_raffle`, `finish_raffle`, `draw_raffle_winner`, `mark_raffle_result_absent`; RLS por `can_manage_event`.
- **Código novo**: `src/lib/db/raffles.ts`, `src/lib/validation/raffle.ts`, `src/lib/raffle-slots.ts`, `src/lib/upload-event-image.ts`, rotas em `src/app/api/eventos/[slug]/sorteios/**`, telas em `src/app/painel/sorteios/**`.
- **Código alterado**: `src/lib/types.ts`, `src/lib/database.types.ts`, `src/lib/db/errors.ts`, `src/lib/db/mappers.ts`, `src/lib/validation/event.ts`, `src/app/painel/layout.tsx`, `src/app/painel/PainelOverview.tsx`, `src/app/painel/editor/EditorForm.tsx`, `src/app/painel/presentes/GiftManager.tsx` (upload extraído para `upload-event-image.ts`), `src/app/globals.css` (estilos do palco).
- **Sem impacto**: página pública do evento, e-mails, pagamentos.
- **Testes**: `tests/raffles.test.mjs`.
