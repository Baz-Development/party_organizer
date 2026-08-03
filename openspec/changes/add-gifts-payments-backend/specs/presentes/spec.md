## ADDED Requirements

### Requirement: Catálogo de presentes do evento

O sistema MUST permitir que quem administra o evento cadastre presentes com nome,
categoria e preço obrigatórios e, opcionalmente, loja e observação, cada presente
pertencendo a um único evento.

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

### Requirement: Reserva de presente com expiração

O sistema MUST permitir que um convidado reserve um presente disponível, tornando-o
indisponível para outros durante uma janela limitada, e MUST liberar a reserva
automaticamente quando ela expira sem pagamento confirmado.

#### Scenario: Reserva bem-sucedida

- **WHEN** um convidado reserva um presente disponível
- **THEN** o presente passa a reservado e deixa de ser oferecido a outros convidados
- **AND** a reserva registra quem reservou e quando expira

#### Scenario: Reserva concorrente

- **WHEN** dois convidados tentam reservar o mesmo presente disponível ao mesmo tempo
- **THEN** exatamente um obtém a reserva
- **AND** o outro recebe aviso de presente já reservado

#### Scenario: Reserva expirada

- **WHEN** uma reserva atinge o prazo de expiração sem pagamento confirmado
- **THEN** o presente volta ao estado disponível
- **AND** pode ser reservado por outro convidado

#### Scenario: Reserva de presente já comprado

- **WHEN** um convidado tenta reservar um presente já comprado
- **THEN** a operação é recusada

### Requirement: Presente de cota

O sistema MUST suportar presentes divididos em cotas, com meta de valor e valor
arrecadado, aceitando contribuições de vários convidados até a meta ser atingida.

#### Scenario: Contribuição registrada

- **WHEN** o pagamento de uma contribuição de cota é confirmado
- **THEN** o valor arrecadado do presente aumenta no valor contribuído

#### Scenario: Meta atingida

- **WHEN** o valor arrecadado alcança a meta
- **THEN** o presente passa a comprado
- **AND** deixa de aceitar novas contribuições

#### Scenario: Contribuição acima do restante

- **WHEN** uma contribuição excede o valor que falta para a meta
- **THEN** a operação é recusada informando o valor máximo aceito
- **AND** o valor arrecadado permanece inalterado

#### Scenario: Contribuições simultâneas

- **WHEN** duas contribuições são confirmadas ao mesmo tempo para a mesma cota
- **THEN** o valor arrecadado reflete a soma exata das duas
- **AND** a meta não é ultrapassada

### Requirement: Visibilidade do estado do presente

A página pública MUST indicar quais presentes já foram escolhidos sem revelar a
identidade de quem os escolheu, e quem administra o evento MUST enxergar essa
identidade.

#### Scenario: Convidado vê disponibilidade, não identidade

- **WHEN** um convidado abre a lista de presentes
- **THEN** vê quais estão disponíveis, reservados ou comprados
- **AND** não vê o nome de quem reservou ou comprou

#### Scenario: Anfitrião vê quem presenteou

- **WHEN** quem administra o evento abre o acompanhamento de presentes
- **THEN** vê, para cada presente escolhido, quem reservou ou pagou e o valor

### Requirement: Acompanhamento no painel

O painel MUST apresentar ao anfitrião o total de presentes, quantos foram
presenteados e o valor total arrecadado, considerando apenas pagamentos confirmados.

#### Scenario: Total considera só o confirmado

- **WHEN** existe um checkout iniciado e não pago
- **THEN** o valor dele não entra no total arrecadado

#### Scenario: Total após reembolso

- **WHEN** um pagamento confirmado é reembolsado
- **THEN** o valor sai do total arrecadado
