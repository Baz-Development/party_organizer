## MODIFIED Requirements

### Requirement: Catálogo de presentes do evento

O sistema MUST permitir que quem administra o evento cadastre presentes com nome,
categoria e preço obrigatórios e, opcionalmente, loja e observação, cada presente
pertencendo a um único evento. O sistema MUST oferecer ao anfitrião uma tela no
painel do evento para criar, editar e remover presentes desse catálogo, incluindo
a definição de um presente como cota com meta de valor.

#### Scenario: Presente cadastrado

- **WHEN** o anfitrião cadastra um presente com nome, categoria e preço
- **THEN** o presente passa a existir no evento com estado disponível
- **AND** aparece em `/e/[slug]/presentes` quando o módulo está habilitado

#### Scenario: Preço inválido

- **WHEN** um presente é enviado com preço ausente, zero ou negativo
- **THEN** a operação é recusada com erro de validação

#### Scenario: Somente quem administra o evento edita o catálogo

- **WHEN** um visitante ou convidado tenta criar, editar ou remover um presente
- **THEN** a operação é recusada por falta de autorização

#### Scenario: Catálogo público apenas de evento publicado

- **WHEN** o catálogo de um evento em rascunho é requisitado por um visitante
- **THEN** a operação é recusada e nenhum presente é revelado

#### Scenario: Anfitrião gerencia o catálogo pelo painel

- **WHEN** o anfitrião abre a tela de presentes no painel do seu evento
- **THEN** vê a lista de presentes cadastrados e pode adicionar, editar e remover itens
- **AND** cada alteração salva persiste no catálogo do evento e reflete em `/e/[slug]/presentes`

#### Scenario: Presente de cota criado pelo painel

- **WHEN** o anfitrião cadastra um presente informando uma meta de cota maior que zero
- **THEN** o presente passa a existir como presente de cota com valor arrecadado zero

#### Scenario: Anfitrião de outro evento não acessa o catálogo alheio

- **WHEN** um anfitrião tenta gerenciar pelo painel os presentes de um evento do qual não é anfitrião
- **THEN** a operação é recusada e nenhum presente do outro evento é revelado

### Requirement: Visibilidade do estado do presente

A página pública MUST indicar quais presentes já foram escolhidos sem revelar a
identidade de quem os escolheu, e quem administra o evento MUST enxergar essa
identidade. A tela de presentes do painel MUST mostrar ao anfitrião, para cada
presente, o estado atual (disponível, reservado ou comprado), o valor arrecadado
quando for cota e quem reservou ou pagou.

#### Scenario: Convidado vê disponibilidade, não identidade

- **WHEN** um convidado abre a lista de presentes
- **THEN** vê quais estão disponíveis, reservados ou comprados
- **AND** não vê o nome de quem reservou ou comprou

#### Scenario: Anfitrião vê quem presenteou

- **WHEN** quem administra o evento abre o acompanhamento de presentes
- **THEN** vê, para cada presente escolhido, quem reservou ou pagou e o valor

#### Scenario: Painel exibe estado e progresso de cada presente

- **WHEN** o anfitrião abre a tela de presentes no painel
- **THEN** cada presente mostra seu estado atual e, se for cota, o valor arrecadado em relação à meta
- **AND** presentes já escolhidos mostram o nome de quem reservou ou pagou
