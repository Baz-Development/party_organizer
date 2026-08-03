## ADDED Requirements

### Requirement: Login por link mágico

O sistema MUST permitir que cliente, membro de organização e admin entrem
informando apenas o e-mail e recebendo um link de acesso de uso único. O sistema
MUST NOT exigir senha.

#### Scenario: E-mail cadastrado ou novo

- **WHEN** uma pessoa informa um e-mail válido na tela de entrada
- **THEN** o sistema envia um link de acesso para esse e-mail
- **AND** responde com a mesma mensagem de confirmação, exista ou não uma conta com
  aquele e-mail

#### Scenario: Link consumido

- **WHEN** a pessoa abre o link de acesso recebido
- **THEN** uma sessão é criada e ela é levada ao painel correspondente ao seu papel
- **AND** o mesmo link não pode ser usado uma segunda vez

#### Scenario: Link expirado ou inválido

- **WHEN** a pessoa abre um link de acesso expirado, já usado ou adulterado
- **THEN** nenhuma sessão é criada
- **AND** ela é levada de volta à tela de entrada com aviso de link inválido

### Requirement: Perfil criado no primeiro acesso

O sistema MUST manter um perfil por usuário autenticado, criado automaticamente no
primeiro login, contendo ao menos nome de exibição e e-mail.

#### Scenario: Primeiro login

- **WHEN** um usuário autentica pela primeira vez
- **THEN** um perfil correspondente passa a existir vinculado à sua identidade
- **AND** logins seguintes reutilizam o mesmo perfil

#### Scenario: Usuário edita o próprio perfil

- **WHEN** um usuário autenticado altera seu nome de exibição
- **THEN** a alteração é persistida
- **AND** ele não consegue alterar o perfil de outro usuário

### Requirement: Papéis de acesso

O sistema MUST distinguir três papéis autenticados — cliente (anfitrião do evento),
membro de organização e admin da plataforma — e conceder a cada um apenas o alcance
correspondente. O papel de admin MUST NOT ser atribuível por qualquer fluxo exposto
na aplicação.

#### Scenario: Cliente acessa apenas os próprios eventos

- **WHEN** um cliente autenticado abre o painel
- **THEN** vê somente os eventos em que é anfitrião
- **AND** requisitar dados de um evento de outro cliente retorna erro de autorização

#### Scenario: Membro de organização acessa o portfólio da organização

- **WHEN** um membro de organização autenticado abre o painel da organização
- **THEN** vê os eventos das organizações às quais pertence
- **AND** não vê eventos de outras organizações

#### Scenario: Admin acessa a plataforma inteira

- **WHEN** um admin autenticado abre o painel administrativo
- **THEN** vê organizações e eventos de toda a plataforma

#### Scenario: Escalada de privilégio bloqueada

- **WHEN** um usuário autenticado tenta alterar o próprio papel para admin por
  qualquer rota da aplicação
- **THEN** a operação é recusada e o papel permanece inalterado

### Requirement: Proteção das áreas autenticadas

As áreas de cliente, organização e admin MUST exigir sessão válida, e a
verificação MUST ocorrer no servidor. Esconder elementos apenas na interface NÃO É
suficiente.

#### Scenario: Acesso sem sessão

- **WHEN** uma pessoa sem sessão acessa uma rota do painel do cliente, da
  organização ou do admin
- **THEN** é redirecionada para a tela de entrada
- **AND** após autenticar, é levada à rota que tentou acessar originalmente

#### Scenario: Papel insuficiente

- **WHEN** um cliente autenticado acessa uma rota exclusiva de admin
- **THEN** recebe erro de autorização
- **AND** nenhum dado da rota é retornado

#### Scenario: Encerramento de sessão

- **WHEN** um usuário autenticado escolhe sair
- **THEN** a sessão é invalidada no servidor
- **AND** requisições subsequentes com os cookies antigos são tratadas como não
  autenticadas

### Requirement: Acesso público do convidado sem conta

O convidado MUST NOT precisar de conta para ver um evento publicado nem para usar
os módulos abertos a ele. O acesso público MUST se limitar aos eventos publicados e
aos dados marcados como visíveis ao convidado.

#### Scenario: Evento publicado é público

- **WHEN** qualquer pessoa, autenticada ou não, abre a página de um evento publicado
- **THEN** vê os dados públicos do evento sem qualquer etapa de login

#### Scenario: Evento em rascunho não é público

- **WHEN** uma pessoa sem vínculo com o evento abre a página de um evento em
  rascunho ou encerrado para novas visitas
- **THEN** recebe a resposta de evento não encontrado
- **AND** nenhum dado do evento é revelado

#### Scenario: Identificação por token de convite

- **WHEN** um convidado abre o evento por um link que carrega seu token de convite
  válido
- **THEN** o sistema o reconhece como aquele convidado nas ações que exigem
  identificação, sem criar conta
- **AND** um token inválido ou de outro evento não concede nenhuma identificação
