# midia-storage Specification

## Purpose
TBD - created by archiving change add-media-storage-backend. Update Purpose after archive.
## Requirements
### Requirement: Separação de buckets por origem do conteúdo

O sistema MUST manter em buckets distintos os arquivos curados por quem administra o
evento e os arquivos enviados por convidados, com políticas de acesso próprias para
cada um.

#### Scenario: Convidado não escreve no bucket curado

- **WHEN** um convidado tenta enviar um arquivo para o bucket de mídia do evento
- **THEN** a operação é recusada

#### Scenario: Arquivo organizado por evento

- **WHEN** um arquivo é enviado
- **THEN** ele é gravado sob um caminho que identifica o evento a que pertence
- **AND** não pode ser gravado sob o caminho de outro evento

### Requirement: Upload por URL assinada

O upload MUST ocorrer por URL assinada emitida pelo servidor, de uso único e com
validade curta. O cliente MUST NOT enviar arquivos usando credencial de longa
duração.

#### Scenario: URL emitida após validação

- **WHEN** um convidado solicita permissão para enviar uma foto a um evento
  publicado com o módulo habilitado
- **THEN** recebe uma URL de upload assinada, válida por tempo limitado

#### Scenario: Solicitação para evento fechado

- **WHEN** a URL de upload é solicitada para um evento em rascunho, encerrado ou com
  o módulo desabilitado
- **THEN** a operação é recusada e nenhuma URL é emitida

#### Scenario: URL expirada

- **WHEN** um upload é tentado com uma URL assinada expirada
- **THEN** a operação é recusada

### Requirement: Limites de tipo, tamanho e quantidade

O sistema MUST recusar arquivos fora dos formatos de imagem suportados, acima do
tamanho máximo configurado, e MUST limitar quantos envios um mesmo convidado pode
fazer em um intervalo.

#### Scenario: Formato não suportado

- **WHEN** um arquivo que não é imagem em formato suportado é enviado
- **THEN** o upload é recusado e nenhum registro é criado

#### Scenario: Tamanho excedido

- **WHEN** um arquivo maior que o limite configurado é enviado
- **THEN** o upload é recusado informando o limite

#### Scenario: Excesso de envios

- **WHEN** um mesmo convidado excede o número de envios permitido no intervalo
- **THEN** os envios seguintes são recusados até o intervalo passar

#### Scenario: Extensão que não corresponde ao conteúdo

- **WHEN** um arquivo é enviado com extensão de imagem mas conteúdo de outro tipo
- **THEN** o upload é recusado

### Requirement: Leitura de arquivo respeita a visibilidade do evento

O acesso a um arquivo MUST seguir a visibilidade do evento e o estado de moderação
do item correspondente. Arquivos de evento não publicado ou de item não aprovado
MUST NOT ser legíveis publicamente.

#### Scenario: Arquivo de evento em rascunho

- **WHEN** alguém sem vínculo tenta acessar a URL de um arquivo de evento em rascunho
- **THEN** o acesso é negado

#### Scenario: Arquivo aguardando aprovação

- **WHEN** alguém acessa a URL de um arquivo cujo item ainda não foi aprovado
- **THEN** o acesso é negado a todos, exceto a quem administra o evento

#### Scenario: URL não adivinhável

- **WHEN** os caminhos de arquivos de um evento são comparados
- **THEN** não é possível derivar o caminho de outro arquivo a partir de um conhecido

### Requirement: Ciclo de vida do arquivo junto ao registro

O sistema MUST remover o arquivo do Storage quando o registro correspondente é
excluído, e MUST NOT deixar registros apontando para arquivos inexistentes.

#### Scenario: Item removido

- **WHEN** quem administra o evento remove uma foto
- **THEN** o registro e o arquivo correspondente deixam de existir

#### Scenario: Upload abandonado

- **WHEN** uma URL de upload é emitida e o envio nunca é concluído
- **THEN** nenhum item aparece na galeria
- **AND** nenhum arquivo órfão permanece após a rotina de limpeza

