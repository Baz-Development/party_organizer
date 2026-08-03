## Why

`/e/[slug]/cardapio` mostra opções com contagens fixas: votar não muda nada e o
anfitrião não tem como saber o que o grupo prefere. A votação de cardápio é decisão
com prazo — fechada a enquete, o resultado vira pedido ao buffet — então precisa de
apuração confiável e de um voto por pessoa.

## What Changes

- Cria enquetes de cardápio por evento, uma por etapa da refeição (entrada, prato
  principal, sobremesa), com pergunta, prazo de encerramento e número máximo de
  escolhas.
- Cria as opções de cada enquete, com nome, descrição e etiquetas (vegetariano, sem
  glúten, etc.).
- Persiste os votos dos convidados, garantindo um conjunto de escolhas por pessoa
  por enquete, com possibilidade de troca até o prazo.
- Apura o resultado a partir dos votos gravados, em vez de contagem estática.
- Encerra a enquete automaticamente no prazo e apresenta a opção vencedora ao
  anfitrião.
- Adiciona ao painel a curadoria das enquetes e a visão de apuração.

## Capabilities

### New Capabilities

- `cardapio`: enquetes de cardápio, opções, votos com limite por pessoa, prazo de
  encerramento e apuração do resultado.

### Modified Capabilities

Nenhuma.

## Impact

- **Depende de**: `add-supabase-foundation` e da identificação por token de convite
  de `add-guests-rsvp-backend`, usada para garantir um voto por convidado.
- **Novas tabelas**: `menu_polls`, `menu_options`, `menu_votes`.
- **Rotas afetadas**: novas rotas de listagem de enquetes, envio de voto e apuração.
- **Telas afetadas**: `/e/[slug]/cardapio`, `/painel/editor` (curadoria das
  enquetes), `/painel` (resultado).
- **Riscos**: voto múltiplo por quem não é convidado identificado; apuração
  divergindo do que o convidado viu ao votar.
