## ADDED Requirements

### Requirement: Envio de foto pelo convidado

O sistema MUST permitir que um convidado envie fotos para um evento publicado com o
módulo de galeria habilitado, informando autor e legenda opcional.

#### Scenario: Foto enviada

- **WHEN** um convidado conclui o envio de uma foto com autor informado
- **THEN** a foto é registrada no evento com data de envio
- **AND** entra no fluxo de moderação configurado pelo anfitrião

#### Scenario: Autor ausente

- **WHEN** uma foto é enviada sem identificação de autor e sem token de convite
- **THEN** a operação é recusada com erro de validação

#### Scenario: Módulo desabilitado

- **WHEN** uma foto é enviada para um evento com o módulo de galeria desabilitado
- **THEN** a operação é recusada

### Requirement: Moderação da galeria

O sistema MUST respeitar a política de moderação do evento: com aprovação prévia, a
foto só aparece publicamente após ser aprovada; sem aprovação prévia, aparece
imediatamente e pode ser ocultada depois.

#### Scenario: Aprovação prévia ativa

- **WHEN** uma foto é enviada a um evento com aprovação prévia
- **THEN** ela não aparece na galeria pública
- **AND** aparece na fila de aprovação de quem administra o evento

#### Scenario: Foto aprovada

- **WHEN** quem administra o evento aprova uma foto pendente
- **THEN** ela passa a aparecer na galeria pública

#### Scenario: Foto ocultada após publicação

- **WHEN** quem administra o evento oculta uma foto já visível
- **THEN** ela deixa de aparecer na galeria pública imediatamente

#### Scenario: Moderação restrita

- **WHEN** um convidado tenta aprovar, ocultar ou remover uma foto
- **THEN** a operação é recusada por falta de autorização

### Requirement: Listagem paginada da galeria

O sistema MUST listar as fotos visíveis de um evento em páginas, da mais recente
para a mais antiga, sem incluir itens pendentes ou ocultos para o público.

#### Scenario: Galeria vazia

- **WHEN** um evento publicado ainda não tem nenhuma foto visível
- **THEN** a listagem retorna vazia e a tela apresenta o estado vazio

#### Scenario: Paginação estável

- **WHEN** páginas seguintes são requisitadas
- **THEN** nenhuma foto aparece duas vezes nem é pulada entre páginas

#### Scenario: Pendentes fora do público

- **WHEN** um evento tem fotos pendentes de aprovação
- **THEN** elas não aparecem na listagem pública
- **AND** aparecem na listagem de quem administra o evento

### Requirement: Curtidas em fotos

O sistema MUST registrar curtidas em fotos visíveis e MUST contar cada visitante uma
única vez por foto.

#### Scenario: Curtida registrada

- **WHEN** um visitante curte uma foto visível
- **THEN** a contagem de curtidas daquela foto aumenta em um

#### Scenario: Curtida repetida

- **WHEN** o mesmo visitante curte a mesma foto novamente
- **THEN** a contagem não aumenta uma segunda vez

#### Scenario: Curtida em foto não visível

- **WHEN** alguém tenta curtir uma foto pendente ou oculta
- **THEN** a operação é recusada
