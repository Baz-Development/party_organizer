## MODIFIED Requirements

### Requirement: Token de convite por convidado

O sistema MUST gerar para cada convidado um token opaco, imprevisível e único, que o
identifica na página pública do evento sem exigir conta. Esse token é o caminho
primário de identificação do convidado: o link que o carrega MUST poder ser
compartilhado por qualquer meio (cópia, WhatsApp, mensagem) sem depender de
envio de e-mail.

#### Scenario: Link identifica o convidado

- **WHEN** um convidado abre o evento pelo link que carrega seu token válido
- **THEN** o formulário de RSVP vem preenchido com o nome dele
- **AND** a resposta é atribuída àquele convidado

#### Scenario: Token de outro evento

- **WHEN** um token válido de outro evento é usado na página deste evento
- **THEN** nenhuma identificação é concedida
- **AND** nenhum dado do outro evento é revelado

#### Scenario: Token inexistente ou adulterado

- **WHEN** o link carrega um token que não existe ou foi alterado
- **THEN** o convidado é tratado como visitante anônimo

#### Scenario: Token não enumerável

- **WHEN** tokens de convite de um mesmo evento são comparados
- **THEN** não é possível derivar um token válido a partir de outro

#### Scenario: Reabertura do mesmo link

- **WHEN** o convidado reabre o link que já usou
- **THEN** enxerga a própria resposta atual e pode alterá-la enquanto o prazo permitir
- **AND** nenhuma resposta duplicada é criada

### Requirement: RSVP de convidado não listado

O sistema MUST permitir que uma pessoa não cadastrada envie RSVP informando seu
nome — criando um convidado novo marcado como não listado — SOMENTE quando o
acesso vier por um link de auto-cadastro do evento cujo token seja válido. Sem
esse token, e sem token de convidado, nenhuma resposta é aceita e nenhum
convidado é criado.

#### Scenario: Link de auto-cadastro válido

- **WHEN** uma pessoa acessa o RSVP pelo link de auto-cadastro do evento com token válido e envia nome e resposta
- **THEN** um convidado é criado com a resposta enviada
- **AND** ele aparece em `/painel/convidados` sinalizado como não listado

#### Scenario: Sem token de convite nem de auto-cadastro

- **WHEN** uma pessoa abre `/{id}/{slug}/rsvp` sem `?convite=` e sem `?lista=`
- **THEN** a página não oferece campo de nome livre
- **AND** orienta a pessoa a solicitar seu link de convite a quem organiza

#### Scenario: Token de auto-cadastro revogado ou inválido

- **WHEN** o link de auto-cadastro usa um token que o anfitrião revogou ou que nunca existiu
- **THEN** a operação é recusada
- **AND** nenhum convidado é criado

#### Scenario: Auto-cadastro após o prazo

- **WHEN** alguém tenta se auto-cadastrar depois do prazo de RSVP do evento
- **THEN** a operação é recusada com aviso de prazo encerrado

#### Scenario: Confirmação anônima pela URL nua não é aceita

- **WHEN** um visitante sem nenhum token envia uma confirmação pela página pública do evento
- **THEN** a operação é recusada
- **AND** nenhum convidado e nenhuma resposta são gravados
