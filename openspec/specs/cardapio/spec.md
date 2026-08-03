# cardapio Specification

## Purpose
TBD - created by archiving change add-menu-poll-backend. Update Purpose after archive.
## Requirements
### Requirement: Enquete de cardápio por etapa

O sistema MUST permitir que quem administra o evento crie enquetes de cardápio, cada
uma com etapa da refeição, pergunta, prazo de encerramento e número máximo de
escolhas por pessoa.

#### Scenario: Enquete criada

- **WHEN** o anfitrião cria uma enquete de sobremesa com prazo e limite de duas
  escolhas
- **THEN** a enquete passa a existir no evento
- **AND** aparece em `/e/[slug]/cardapio` quando o módulo está habilitado

#### Scenario: Limite de escolhas inválido

- **WHEN** uma enquete é criada com número máximo de escolhas menor que um
- **THEN** a operação é recusada com erro de validação

#### Scenario: Prazo no passado

- **WHEN** uma enquete é criada com prazo de encerramento já vencido
- **THEN** a operação é recusada com erro de validação

#### Scenario: Curadoria restrita

- **WHEN** um convidado tenta criar ou editar uma enquete
- **THEN** a operação é recusada por falta de autorização

### Requirement: Opções da enquete

Cada enquete MUST ter ao menos duas opções, com nome obrigatório e, opcionalmente,
descrição e etiquetas de restrição alimentar.

#### Scenario: Enquete publicada com opções suficientes

- **WHEN** uma enquete com duas ou mais opções é disponibilizada aos convidados
- **THEN** todas as opções aparecem na página do cardápio

#### Scenario: Opções insuficientes

- **WHEN** uma enquete com menos de duas opções é disponibilizada
- **THEN** a operação é recusada

#### Scenario: Remoção de opção votada

- **WHEN** o anfitrião remove uma opção que já recebeu votos
- **THEN** a remoção exige confirmação explícita
- **AND** os votos naquela opção deixam de contar na apuração

### Requirement: Voto do convidado

O sistema MUST registrar o voto de um convidado identificado, respeitando o número
máximo de escolhas da enquete e aceitando apenas opções pertencentes àquela enquete.

#### Scenario: Voto dentro do limite

- **WHEN** um convidado identificado escolhe duas opções em uma enquete que permite
  duas
- **THEN** o voto é registrado com as duas escolhas

#### Scenario: Excesso de escolhas

- **WHEN** um convidado escolhe mais opções do que a enquete permite
- **THEN** a operação é recusada informando o limite

#### Scenario: Opção de outra enquete

- **WHEN** o voto referencia uma opção que não pertence à enquete
- **THEN** a operação é recusada e nada é gravado

#### Scenario: Visitante não identificado

- **WHEN** alguém sem token de convite tenta votar
- **THEN** a operação é recusada
- **AND** as contagens permanecem inalteradas

### Requirement: Um voto por convidado por enquete

O sistema MUST manter no máximo um conjunto de escolhas por convidado por enquete, e
MUST permitir que ele troque as escolhas enquanto a enquete estiver aberta.

#### Scenario: Troca de voto

- **WHEN** um convidado que já votou envia novas escolhas antes do prazo
- **THEN** as escolhas anteriores são substituídas
- **AND** a contagem total de votantes não aumenta

#### Scenario: Votos concorrentes do mesmo convidado

- **WHEN** dois envios do mesmo convidado chegam simultaneamente
- **THEN** apenas um conjunto de escolhas permanece registrado

### Requirement: Encerramento da enquete

O sistema MUST recusar votos após o prazo de encerramento e MUST NOT alterar o
resultado apurado depois disso.

#### Scenario: Voto após o prazo

- **WHEN** um convidado tenta votar depois do prazo
- **THEN** a operação é recusada com aviso de enquete encerrada

#### Scenario: Resultado congelado

- **WHEN** uma enquete encerrada é consultada
- **THEN** o resultado apresentado é o mesmo em consultas sucessivas

### Requirement: Apuração a partir dos votos

O resultado MUST ser calculado a partir dos votos gravados, e a página do cardápio
MUST apresentar a contagem por opção.

#### Scenario: Contagem reflete o voto

- **WHEN** um convidado vota em uma opção
- **THEN** a contagem daquela opção aumenta em um na próxima consulta

#### Scenario: Contagem após troca de voto

- **WHEN** um convidado troca sua escolha de uma opção para outra
- **THEN** a contagem da opção antiga diminui em um e a da nova aumenta em um

#### Scenario: Empate

- **WHEN** duas opções terminam com a mesma contagem
- **THEN** ambas são apresentadas como empatadas, sem escolha arbitrária de vencedora

