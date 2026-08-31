# mural Specification

## Purpose
TBD - created by archiving change add-media-storage-backend. Update Purpose after archive.
## Requirements
### Requirement: Recado no mural

O sistema MUST permitir que um convidado deixe um recado em um evento publicado
com o módulo de mural habilitado, informando autor e mensagem, ambos
obrigatórios, e opcionalmente **uma foto**. A foto, quando enviada, MUST usar o
mesmo armazenamento e os mesmos limites de tamanho e formato da galeria.

#### Scenario: Recado publicado

- **WHEN** um convidado envia um recado com autor e mensagem
- **THEN** o recado é registrado com data de envio e fica visível imediatamente
  no mural público

#### Scenario: Recado com foto

- **WHEN** um convidado envia um recado com autor, mensagem e uma foto válida
- **THEN** o recado é registrado com a foto anexada e ambos ficam visíveis
  imediatamente no mural público

#### Scenario: Mensagem vazia

- **WHEN** um recado é enviado com mensagem vazia ou apenas espaços
- **THEN** a operação é recusada com erro de validação

#### Scenario: Mensagem excede o limite

- **WHEN** um recado excede o número máximo de caracteres
- **THEN** a operação é recusada informando o limite

#### Scenario: Foto fora do formato ou do tamanho

- **WHEN** a foto anexada excede o tamanho máximo ou não é um formato de imagem
  aceito
- **THEN** a operação é recusada e o recado não é gravado

#### Scenario: Conteúdo tratado como texto

- **WHEN** um recado contém marcação HTML ou script
- **THEN** ele é exibido como texto literal, sem ser interpretado pelo navegador

### Requirement: Moderação do mural

O mural MUST publicar todo recado imediatamente, sem fila de aprovação prévia,
independentemente da política de moderação do evento. Quem administra o evento
MUST poder ocultar ou remover qualquer recado depois de publicado.

#### Scenario: Publicação imediata mesmo com aprovação prévia no evento

- **WHEN** um recado é enviado a um evento cuja política de moderação é aprovação
  prévia
- **THEN** o recado aparece no mural público imediatamente
- **AND** não existe fila de recados pendentes para esse evento

#### Scenario: Recado ocultado

- **WHEN** quem administra o evento oculta um recado visível
- **THEN** ele deixa de aparecer no mural público imediatamente

#### Scenario: Recado removido

- **WHEN** quem administra o evento remove um recado
- **THEN** ele deixa de existir e some do mural público

#### Scenario: Moderação restrita

- **WHEN** um convidado tenta ocultar ou remover um recado
- **THEN** a operação é recusada por falta de autorização

### Requirement: Limite de envios por convidado

O sistema MUST limitar quantos recados um mesmo visitante pode enviar em um
intervalo, para conter spam no mural público.

#### Scenario: Envios dentro do limite

- **WHEN** um visitante envia recados dentro do limite do intervalo
- **THEN** todos são aceitos

#### Scenario: Limite excedido

- **WHEN** um visitante excede o limite de recados no intervalo
- **THEN** os envios seguintes são recusados até o intervalo passar

### Requirement: Curtidas em recados

O sistema MUST registrar curtidas em recados visíveis e MUST contar cada visitante
uma única vez por recado.

#### Scenario: Curtida registrada

- **WHEN** um visitante curte um recado visível
- **THEN** a contagem de curtidas daquele recado aumenta em um

#### Scenario: Curtida repetida

- **WHEN** o mesmo visitante curte o mesmo recado novamente
- **THEN** a contagem não aumenta uma segunda vez

