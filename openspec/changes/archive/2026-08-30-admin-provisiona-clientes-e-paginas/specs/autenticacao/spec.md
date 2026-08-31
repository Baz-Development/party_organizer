## MODIFIED Requirements

### Requirement: Perfil criado no primeiro acesso

O sistema MUST manter um perfil por usuário autenticado, contendo ao menos nome
de exibição e e-mail. O perfil de um cliente MUST ser provisionado antes pelo
admin; o primeiro login com aquele e-mail vincula a identidade de autenticação
ao perfil já existente em vez de criar outro. O perfil de um admin é criado por
processo administrativo, nunca por fluxo exposto.

#### Scenario: Primeiro login de cliente provisionado

- **WHEN** um cliente provisionado autentica pela primeira vez
- **THEN** sua identidade de autenticação passa a apontar para o perfil que o
  admin cadastrou, com o mesmo e-mail
- **AND** logins seguintes reutilizam esse perfil

#### Scenario: Login sem provisionamento

- **WHEN** uma pessoa autentica com um e-mail que não foi provisionado e que não
  é anfitrião de nenhum evento
- **THEN** uma sessão é criada mas nenhum painel é acessível
- **AND** ela vê a mensagem de conta sem acesso

#### Scenario: Usuário edita o próprio perfil

- **WHEN** um usuário autenticado altera seu nome de exibição
- **THEN** a alteração é persistida
- **AND** ele não consegue alterar o perfil de outro usuário
