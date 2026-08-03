## ADDED Requirements

### Requirement: Política de moderação e capa do evento

O evento MUST armazenar, como configuração editável por quem o administra, a política
de moderação de conteúdo enviado por convidados — aprovação prévia ou publicação
imediata — e a referência à sua imagem de capa.

#### Scenario: Política alterada

- **WHEN** o anfitrião muda a política de publicação imediata para aprovação prévia
- **THEN** os envios seguintes passam a exigir aprovação
- **AND** o conteúdo já publicado permanece visível

#### Scenario: Capa definida

- **WHEN** o anfitrião define a imagem de capa em `/painel/editor`
- **THEN** a capa é persistida e passa a ser exibida em `/e/[slug]`

#### Scenario: Capa de outro evento

- **WHEN** a capa é apontada para um arquivo que pertence a outro evento
- **THEN** a operação é recusada

#### Scenario: Configuração restrita a quem administra

- **WHEN** alguém sem vínculo com o evento tenta alterar a política de moderação ou a
  capa
- **THEN** a operação é recusada por falta de autorização
