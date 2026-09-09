## MODIFIED Requirements

### Requirement: Prazo de RSVP e lista aberta

O evento MUST armazenar, como configuração editável por quem o administra, um prazo
opcional para respostas de RSVP. O evento MUST permitir que quem o administra
ative um link de auto-cadastro — que habilita pessoas não cadastradas a enviar
RSVP informando o próprio nome — e revogue esse link a qualquer momento. Enquanto
o link de auto-cadastro não estiver ativo, apenas convidados com token de convite
podem responder.

#### Scenario: Prazo configurado

- **WHEN** o anfitrião define um prazo de RSVP em `/painel/editor`
- **THEN** o prazo é persistido e passa a valer para as respostas do evento

#### Scenario: Prazo anterior à criação do evento

- **WHEN** um prazo de RSVP no passado é enviado
- **THEN** a operação é recusada com erro de validação

#### Scenario: Link de auto-cadastro ativado

- **WHEN** o anfitrião ativa o link de auto-cadastro do evento
- **THEN** o sistema passa a fornecer um link com token que habilita o RSVP de não cadastrados
- **AND** a partir daí respostas por esse link são aceitas até o prazo

#### Scenario: Link de auto-cadastro revogado

- **WHEN** o anfitrião revoga o link de auto-cadastro
- **THEN** o token anterior deixa de valer
- **AND** novos acessos por aquele link são recusados

#### Scenario: Configuração restrita a quem administra

- **WHEN** alguém sem vínculo com o evento tenta alterar o prazo ou o link de auto-cadastro
- **THEN** a operação é recusada por falta de autorização
