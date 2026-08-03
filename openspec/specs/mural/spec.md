# mural Specification

## Purpose
TBD - created by archiving change add-media-storage-backend. Update Purpose after archive.
## Requirements
### Requirement: Recado no mural

O sistema MUST permitir que um convidado deixe um recado em um evento publicado com
o módulo de mural habilitado, informando autor e mensagem, ambos obrigatórios.

#### Scenario: Recado publicado

- **WHEN** um convidado envia um recado com autor e mensagem
- **THEN** o recado é registrado com data de envio
- **AND** entra no fluxo de moderação configurado pelo anfitrião

#### Scenario: Mensagem vazia

- **WHEN** um recado é enviado com mensagem vazia ou apenas espaços
- **THEN** a operação é recusada com erro de validação

#### Scenario: Mensagem excede o limite

- **WHEN** um recado excede o número máximo de caracteres
- **THEN** a operação é recusada informando o limite

#### Scenario: Conteúdo tratado como texto

- **WHEN** um recado contém marcação HTML ou script
- **THEN** ele é exibido como texto literal, sem ser interpretado pelo navegador

### Requirement: Moderação do mural

O sistema MUST aplicar ao mural a mesma política de moderação do evento usada na
galeria, permitindo a quem administra aprovar, ocultar ou remover qualquer recado.

#### Scenario: Aprovação prévia ativa

- **WHEN** um recado é enviado a um evento com aprovação prévia
- **THEN** ele não aparece no mural público até ser aprovado

#### Scenario: Recado removido

- **WHEN** quem administra o evento remove um recado
- **THEN** ele deixa de existir e some do mural público

#### Scenario: Moderação restrita

- **WHEN** um convidado tenta aprovar, ocultar ou remover um recado
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

