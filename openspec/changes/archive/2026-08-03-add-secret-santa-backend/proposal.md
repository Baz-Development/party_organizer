## Why

O amigo secreto tem duas telas prontas — cadastro e revelação — e nenhuma delas
sorteia nada. É o módulo com o requisito mais rígido do produto: se o sorteio vazar,
a brincadeira acaba. Precisa de um algoritmo correto (ninguém tira a si mesmo,
todos são tirados uma vez) e de um modelo de acesso em que nem o anfitrião consegue
ver os pares.

## What Changes

- Cria os participantes do amigo secreto por evento, com nome, lista de desejos e
  data de entrada, aceitando adesão por link.
- Adiciona restrições de par opcionais, para impedir que duas pessoas tirem uma à
  outra.
- Implementa o sorteio: derangement válido, executado uma única vez, atômico, com
  falha explícita quando não há solução possível.
- Persiste os pares de forma que apenas o próprio participante consiga revelar quem
  tirou.
- Persiste a revelação: quem já abriu e quando, sem expor o par a mais ninguém.
- Permite refazer o sorteio antes de qualquer revelação, e bloqueia depois.

## Capabilities

### New Capabilities

- `amigo-secreto`: participantes, lista de desejos, restrições de par, execução do
  sorteio, sigilo dos pares e revelação individual.

### Modified Capabilities

Nenhuma.

## Impact

- **Depende de**: `add-supabase-foundation` e da identificação por token de convite
  de `add-guests-rsvp-backend`, que também identifica o participante na revelação.
- **Novas tabelas**: `secret_santa_participants`, `secret_santa_exclusions`,
  `secret_santa_draws`, `secret_santa_assignments`.
- **Rotas afetadas**: novas rotas de adesão, lista de desejos, execução do sorteio e
  revelação.
- **Telas afetadas**: `/e/[slug]/amigo-secreto`,
  `/e/[slug]/amigo-secreto/revelacao`, `/painel` (estado do sorteio).
- **Consumido por**: `add-transactional-emails`, que envia o link de revelação.
- **Riscos**: qualquer rota, log ou resposta de erro que exponha um par arruína o
  módulo; sorteio executado duas vezes invalida revelações já feitas.
