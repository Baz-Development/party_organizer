## MODIFIED Requirements

### Requirement: Login por link mágico

O sistema MUST permitir que cliente e admin entrem informando apenas o e-mail e
recebendo um link de acesso de uso único. O sistema MUST NOT exigir senha.

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

### Requirement: Papéis de acesso

O sistema MUST distinguir exatamente dois papéis autenticados — `cliente`
(anfitrião do evento) e `admin` (Equipe ALF Eventos) — e conceder a cada um apenas
o alcance correspondente. O papel de `admin` MUST NOT ser atribuível por qualquer
fluxo exposto na aplicação.

#### Scenario: Cliente acessa apenas os próprios eventos

- **WHEN** um cliente autenticado abre o painel
- **THEN** vê somente os eventos em que é anfitrião
- **AND** requisitar dados de um evento de outro cliente retorna erro de autorização

#### Scenario: Admin acessa a plataforma inteira

- **WHEN** um admin autenticado abre o painel administrativo
- **THEN** vê os eventos e as contas de cliente de toda a plataforma

#### Scenario: Não há papel de organização

- **WHEN** qualquer fluxo tenta atribuir a um perfil um papel diferente de
  `cliente` ou `admin`
- **THEN** a operação é recusada

#### Scenario: Escalada de privilégio bloqueada

- **WHEN** um usuário autenticado tenta alterar o próprio papel para admin por
  qualquer rota da aplicação
- **THEN** a operação é recusada e o papel permanece inalterado

### Requirement: Proteção das áreas autenticadas

As áreas de cliente e de admin MUST exigir sessão válida, e a verificação MUST
ocorrer no servidor. Esconder elementos apenas na interface NÃO É suficiente.

#### Scenario: Acesso sem sessão

- **WHEN** uma pessoa sem sessão acessa uma rota do painel do cliente ou do admin
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
