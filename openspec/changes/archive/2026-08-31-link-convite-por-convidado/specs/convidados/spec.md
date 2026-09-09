## ADDED Requirements

### Requirement: Link de convite compartilhável

O sistema MUST disponibilizar a quem administra o evento, para cada convidado, o
link de convite completo (com o token daquele convidado) pronto para
compartilhamento direto, sem exigir envio de e-mail. O link MUST permitir cópia e
MUST oferecer um atalho de envio por WhatsApp; quando o convidado tem telefone
cadastrado, o atalho MUST endereçar esse número.

#### Scenario: Anfitrião obtém o link de um convidado

- **WHEN** quem administra o evento abre um convidado da lista
- **THEN** vê o link de convite completo daquele convidado
- **AND** pode copiá-lo e abrir um envio por WhatsApp já com uma mensagem e o link

#### Scenario: Convidado recém-adicionado

- **WHEN** o anfitrião adiciona um convidado
- **THEN** o link de convite desse convidado fica disponível imediatamente, antes de qualquer e-mail

#### Scenario: Atalho de WhatsApp com telefone

- **WHEN** o convidado tem telefone cadastrado e o anfitrião usa o atalho de WhatsApp
- **THEN** o envio é endereçado a esse telefone

#### Scenario: Link não exposto ao público

- **WHEN** um visitante sem vínculo com o evento consulta a lista de convidados
- **THEN** nenhum link de convite e nenhum token é revelado

#### Scenario: Link restrito a quem administra

- **WHEN** um usuário autenticado sem vínculo com o evento solicita os links de convite
- **THEN** a operação é recusada por falta de autorização

## MODIFIED Requirements

### Requirement: Cadastro de convidado

O sistema MUST permitir que quem administra o evento cadastre convidados com nome
obrigatório e, opcionalmente, grupo, e-mail e telefone, registrando a data do
convite. Ao cadastrar, o sistema MUST provisionar o token de convite do
convidado para que seu link fique disponível de imediato.

#### Scenario: Convidado cadastrado

- **WHEN** o anfitrião cadastra um convidado com nome e grupo
- **THEN** o convidado passa a existir naquele evento com estado pendente
- **AND** a data de convite é registrada
- **AND** o link de convite dele já pode ser obtido

#### Scenario: Nome ausente

- **WHEN** um convidado é enviado sem nome
- **THEN** a operação é recusada com erro de validação e nada é gravado

#### Scenario: Somente quem administra o evento cadastra

- **WHEN** um usuário sem vínculo com o evento tenta cadastrar um convidado
- **THEN** a operação é recusada por falta de autorização

#### Scenario: Convidado pertence a um único evento

- **WHEN** um convidado é consultado no contexto de outro evento
- **THEN** ele não aparece no resultado
