## MODIFIED Requirements

### Requirement: Criação de evento pelo admin

O sistema MUST permitir que apenas um admin crie um evento, informando tipo,
título, data, local, cidade, anfitriões e a conta de cliente que será anfitriã.
O evento MUST nascer em rascunho, com esse cliente como `host_profile_id`. Um
cliente MUST NOT criar eventos.

#### Scenario: Evento criado pelo admin

- **WHEN** um admin cria um evento e atribui um cliente como anfitrião
- **THEN** o evento é criado em rascunho com esse cliente como anfitrião
- **AND** o painel do cliente passa a listar esse evento

#### Scenario: Data inválida

- **WHEN** um evento é enviado sem data ou com data em formato inválido
- **THEN** a criação é recusada com erro de validação
- **AND** nada é gravado

#### Scenario: Criação exige papel de admin

- **WHEN** uma requisição sem sessão ou de um cliente tenta criar um evento
- **THEN** a operação é recusada por falta de autorização
- **AND** nada é gravado

#### Scenario: Cliente administra, mas não cria

- **WHEN** um cliente anfitrião edita conteúdo, cronograma, capa, módulos ou
  modera galeria e mural do próprio evento
- **THEN** as alterações são persistidas normalmente
- **AND** a criação de um novo evento continua indisponível para ele
