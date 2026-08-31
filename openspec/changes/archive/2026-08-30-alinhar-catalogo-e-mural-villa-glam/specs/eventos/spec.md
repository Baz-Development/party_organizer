## ADDED Requirements

### Requirement: Catálogo de tipos de evento

O sistema MUST aceitar como tipo de evento exatamente um destes valores:
casamento, debutante, corporativo, aniversário, formatura, confraternização ou
outros. Um valor fora do catálogo MUST ser recusado.

#### Scenario: Tipo do catálogo aceito

- **WHEN** uma página de evento é criada com tipo "confraternização"
- **THEN** o evento é criado com esse tipo

#### Scenario: Tipo fora do catálogo

- **WHEN** uma página de evento é criada com um tipo que não está no catálogo
- **THEN** a operação é recusada com erro de validação
- **AND** nada é gravado

#### Scenario: Eventos "infantil" existentes

- **WHEN** um evento previamente do tipo "infantil" é consultado após a migração
- **THEN** seu tipo é apresentado como "aniversário"
