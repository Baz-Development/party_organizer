## ADDED Requirements

### Requirement: Prazo de RSVP e lista aberta

O evento MUST armazenar, como configuração editável por quem o administra, um prazo
opcional para respostas de RSVP e um indicador de lista aberta que permite respostas
de pessoas não cadastradas.

#### Scenario: Prazo configurado

- **WHEN** o anfitrião define um prazo de RSVP em `/painel/editor`
- **THEN** o prazo é persistido e passa a valer para as respostas do evento

#### Scenario: Prazo anterior à criação do evento

- **WHEN** um prazo de RSVP no passado é enviado
- **THEN** a operação é recusada com erro de validação

#### Scenario: Lista aberta alternada

- **WHEN** o anfitrião habilita ou desabilita a lista aberta
- **THEN** a configuração é persistida e passa a valer para as próximas respostas

#### Scenario: Configuração restrita a quem administra

- **WHEN** alguém sem vínculo com o evento tenta alterar prazo ou lista aberta
- **THEN** a operação é recusada por falta de autorização
