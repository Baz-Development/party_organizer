# Eventos

## Purpose

Define o evento como entidade central do produto: sua criação pelo admin, o
slug público único que endereça `/e/[slug]`, o ciclo de vida rascunho →
publicado → encerrado, quais módulos estão habilitados, e o conteúdo editorial e
o cronograma.

## Requirements
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

### Requirement: Slug público único

Cada evento MUST ter um slug único na plataforma, usado como endereço público em
`/e/[slug]`. O slug MUST ser gerado a partir do título quando não informado e MUST
permanecer estável após a publicação.

#### Scenario: Slug derivado do título

- **WHEN** um evento é criado sem slug explícito
- **THEN** o sistema gera um slug em minúsculas, sem acentos e com hifens a partir do
  título

#### Scenario: Colisão de slug

- **WHEN** o slug gerado ou informado já pertence a outro evento
- **THEN** o sistema recusa o slug informado com erro de conflito, ou acrescenta um
  sufixo ao slug gerado até torná-lo único

#### Scenario: Slug inexistente

- **WHEN** alguém abre `/e/[slug]` com um slug que não existe
- **THEN** a resposta é de evento não encontrado

### Requirement: Ciclo de vida do evento

Um evento MUST estar em exatamente um destes estados: rascunho, publicado ou
encerrado. Somente eventos publicados MUST ser visíveis ao público.

#### Scenario: Publicação

- **WHEN** o anfitrião ou um admin publica um evento em rascunho
- **THEN** o estado passa a publicado
- **AND** a página pública do evento passa a responder para qualquer visitante

#### Scenario: Despublicação

- **WHEN** o anfitrião ou um admin retorna um evento publicado para rascunho
- **THEN** a página pública deixa de responder para visitantes sem vínculo
- **AND** os dados já coletados permanecem preservados

#### Scenario: Encerramento

- **WHEN** o anfitrião ou um admin encerra um evento
- **THEN** o evento deixa de aceitar novas interações de convidado
- **AND** continua acessível em leitura ao anfitrião e ao admin

#### Scenario: Somente anfitrião ou admin publica

- **WHEN** um usuário sem vínculo com o evento e sem papel de admin tenta alterar
  seu estado
- **THEN** a operação é recusada por falta de autorização

### Requirement: Módulos habilitados por evento

Cada evento MUST definir quais módulos estão habilitados entre RSVP, cronograma,
local, presentes, galeria, mural, cardápio e amigo secreto. Um módulo desabilitado
MUST NOT ser acessível na página pública.

#### Scenario: Módulo habilitado aparece

- **WHEN** o anfitrião habilita o módulo de presentes
- **THEN** a página pública do evento passa a oferecer a seção de presentes

#### Scenario: Módulo desabilitado é inacessível

- **WHEN** um visitante acessa diretamente a rota de um módulo desabilitado no evento
- **THEN** recebe resposta de não encontrado
- **AND** nenhum dado daquele módulo é retornado

#### Scenario: Somente módulos conhecidos

- **WHEN** uma requisição tenta habilitar um identificador de módulo desconhecido
- **THEN** a operação é recusada com erro de validação

### Requirement: Conteúdo editorial e cronograma

O evento MUST armazenar seu conteúdo editorial — chamada, texto de boas-vindas e
tema de cor — e uma lista ordenada de itens de cronograma com horário, título e
descrição.

#### Scenario: Edição pelo editor da página

- **WHEN** o anfitrião altera o texto de boas-vindas ou o tema de cor em
  `/painel/editor`
- **THEN** a alteração é persistida e refletida na página pública do evento

#### Scenario: Ordenação do cronograma

- **WHEN** o cronograma do evento é consultado
- **THEN** os itens vêm na ordem definida pelo anfitrião, de forma estável entre
  consultas

#### Scenario: Tema inválido

- **WHEN** um tema de cor fora do conjunto suportado é enviado
- **THEN** a operação é recusada com erro de validação

### Requirement: Prazo de RSVP e lista aberta

O evento MUST armazenar, como configuração editável por quem o administra, um prazo
opcional para respostas de RSVP e um indicador de lista aberta que permite respostas
de pessoas não cadastradas.

#### Scenario: Prazo configurado

- **WHEN** o anfitrião define um prazo de RSVP em `/painel/editor`
- **THEN** o prazo é persistido e passa a valer para as respostas do evento

#### Scenario: Prazo anterior à criação do evento

- **WHEN** um prazo de RSVP no passado é enviado
- **THEN** a operação é recusada com erro de validação

#### Scenario: Lista aberta alternada

- **WHEN** o anfitrião habilita ou desabilita a lista aberta
- **THEN** a configuração é persistida e passa a valer para as próximas respostas

#### Scenario: Configuração restrita a quem administra

- **WHEN** alguém sem vínculo com o evento tenta alterar prazo ou lista aberta
- **THEN** a operação é recusada por falta de autorização

### Requirement: Política de moderação e capa do evento

O evento MUST armazenar, como configuração editável por quem o administra, a política
de moderação de conteúdo enviado por convidados — aprovação prévia ou publicação
imediata — e a referência à sua imagem de capa.

#### Scenario: Política alterada

- **WHEN** o anfitrião muda a política de publicação imediata para aprovação prévia
- **THEN** os envios seguintes passam a exigir aprovação
- **AND** o conteúdo já publicado permanece visível

#### Scenario: Capa definida

- **WHEN** o anfitrião define a imagem de capa em `/painel/editor`
- **THEN** a capa é persistida e passa a ser exibida em `/e/[slug]`

#### Scenario: Capa de outro evento

- **WHEN** a capa é apontada para um arquivo que pertence a outro evento
- **THEN** a operação é recusada

#### Scenario: Configuração restrita a quem administra

- **WHEN** alguém sem vínculo com o evento tenta alterar a política de moderação ou a
  capa
- **THEN** a operação é recusada por falta de autorização

