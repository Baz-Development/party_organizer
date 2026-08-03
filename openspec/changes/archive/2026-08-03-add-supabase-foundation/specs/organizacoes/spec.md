## ADDED Requirements

### Requirement: Cadastro de organização parceira

O sistema MUST permitir cadastrar organizações parceiras com nome, cidade, contato,
plano e data de início do vínculo, e MUST expor esses dados no painel administrativo
e no painel da própria organização.

#### Scenario: Organização criada

- **WHEN** um admin cadastra uma organização com nome, cidade, contato e plano
- **THEN** a organização passa a existir e aparece na listagem administrativa
- **AND** a data de início do vínculo é registrada

#### Scenario: Campos obrigatórios ausentes

- **WHEN** uma organização é enviada sem nome ou sem plano
- **THEN** a operação é recusada com erro de validação identificando o campo
- **AND** nada é gravado

#### Scenario: Somente admin cadastra organização

- **WHEN** um cliente ou membro de organização tenta cadastrar uma organização
- **THEN** a operação é recusada por falta de autorização

### Requirement: Membros da organização

Uma organização MUST ter um ou mais membros, cada um com papel de proprietário ou
colaborador. Somente proprietários MUST poder adicionar ou remover membros.

#### Scenario: Proprietário convida colaborador

- **WHEN** um proprietário adiciona um e-mail como colaborador da organização
- **THEN** ao autenticar, essa pessoa passa a ver o painel daquela organização

#### Scenario: Colaborador não gerencia membros

- **WHEN** um colaborador tenta adicionar ou remover um membro da organização
- **THEN** a operação é recusada por falta de autorização

#### Scenario: Remoção do último proprietário bloqueada

- **WHEN** a remoção deixaria a organização sem nenhum proprietário
- **THEN** a operação é recusada
- **AND** a composição de membros permanece inalterada

### Requirement: Isolamento entre organizações

Os dados de uma organização — incluindo eventos e tudo que pende deles — MUST NOT
ser legíveis nem alteráveis por membros de outra organização, independentemente da
rota usada.

#### Scenario: Leitura cruzada bloqueada

- **WHEN** um membro da organização A requisita, por qualquer rota, um evento
  pertencente à organização B
- **THEN** recebe resposta de não encontrado ou de falta de autorização
- **AND** nenhum campo do evento é revelado

#### Scenario: Escrita cruzada bloqueada

- **WHEN** um membro da organização A tenta alterar um recurso da organização B
- **THEN** a operação é recusada e nada é gravado

#### Scenario: Listagem escopada

- **WHEN** um membro de organização lista eventos
- **THEN** o resultado contém apenas eventos das organizações a que ele pertence,
  mesmo que a requisição peça explicitamente outras

### Requirement: Métricas da organização

O painel da organização MUST apresentar, para cada organização, o total de eventos e
quantos estão ativos, calculados a partir do estado atual dos eventos.

#### Scenario: Contagem reflete o estado dos eventos

- **WHEN** um evento da organização passa de rascunho para publicado
- **THEN** a contagem de eventos ativos daquela organização aumenta na próxima
  consulta

#### Scenario: Evento encerrado sai da contagem de ativos

- **WHEN** um evento da organização é encerrado
- **THEN** ele permanece no total de eventos, mas deixa de contar como ativo
