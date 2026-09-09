# convidados Specification

## Purpose
TBD - created by archiving change add-guests-rsvp-backend. Update Purpose after archive.
## Requirements
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

### Requirement: Edição e remoção de convidado

O sistema MUST permitir editar e remover convidados enquanto o evento não estiver
encerrado, preservando o histórico de resposta ao editar.

#### Scenario: Dados corrigidos

- **WHEN** o anfitrião corrige o nome ou o grupo de um convidado que já respondeu
- **THEN** a alteração é persistida e a resposta de RSVP permanece intacta

#### Scenario: Remoção

- **WHEN** o anfitrião remove um convidado
- **THEN** o convidado e seu convite deixam de existir
- **AND** o link de convite dele passa a ser inválido

#### Scenario: Convidado de outro evento

- **WHEN** uma requisição tenta editar um convidado que pertence a outro evento
- **THEN** a operação é recusada e nada é alterado

### Requirement: Agrupamento e filtro da lista

O sistema MUST permitir organizar convidados por grupo e filtrar a lista por estado
de resposta.

#### Scenario: Filtro por estado

- **WHEN** a lista é consultada filtrando por confirmados
- **THEN** o resultado contém apenas convidados confirmados

#### Scenario: Filtro inválido

- **WHEN** a lista é consultada com um estado que não existe
- **THEN** a operação é recusada com erro de validação

### Requirement: Estatísticas da lista

O sistema MUST expor, junto da lista, o total de convidados e as contagens de
confirmados, recusados e pendentes, além do total de pessoas esperadas somando
acompanhantes e crianças.

#### Scenario: Contagem após confirmação

- **WHEN** um convidado pendente confirma presença com dois acompanhantes
- **THEN** o total de confirmados aumenta em um
- **AND** o total de pessoas esperadas aumenta em três

#### Scenario: Contagem após mudança de resposta

- **WHEN** um convidado que havia confirmado passa a recusar
- **THEN** ele sai da contagem de confirmados e entra na de recusados
- **AND** seus acompanhantes deixam de contar como pessoas esperadas

### Requirement: Importação de convidados em lote

O sistema MUST permitir importar vários convidados de uma vez a partir de uma
planilha ou colagem de texto, reportando quais linhas foram aceitas e quais foram
rejeitadas.

#### Scenario: Importação parcialmente inválida

- **WHEN** um lote contém linhas válidas e linhas sem nome
- **THEN** as linhas válidas são gravadas
- **AND** a resposta identifica cada linha rejeitada e o motivo

#### Scenario: Duplicata dentro do evento

- **WHEN** o lote contém um convidado com o mesmo nome e e-mail de um já existente no
  evento
- **THEN** o registro existente é reaproveitado em vez de duplicado

### Requirement: Exportação da lista

O sistema MUST permitir que quem administra o evento exporte a lista de convidados
com nome, grupo, contato, estado, acompanhantes, crianças e restrição alimentar.

#### Scenario: Exportação autorizada

- **WHEN** o anfitrião solicita a exportação
- **THEN** recebe um arquivo com todos os convidados daquele evento

#### Scenario: Exportação não autorizada

- **WHEN** alguém sem vínculo com o evento solicita a exportação
- **THEN** a operação é recusada e nenhum dado de convidado é retornado

