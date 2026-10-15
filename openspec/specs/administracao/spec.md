# Administração

## Purpose

Define o que o admin (Equipe ALF Eventos) faz para colocar clientes na plataforma:
provisiona contas de cliente antes do primeiro acesso, acompanha essas contas
pelo painel de admin e cria as páginas de evento já atribuídas ao cliente
anfitrião.

## Requirements

### Requirement: Provisionamento de conta de cliente

O sistema MUST permitir que um admin cadastre uma conta de cliente informando
nome de exibição e e-mail. A conta MUST passar a existir imediatamente, mesmo
antes do primeiro login da pessoa, e o primeiro login com aquele e-mail MUST
reaproveitar a conta provisionada em vez de criar outra.

#### Scenario: Cliente cadastrado pelo admin

- **WHEN** um admin cadastra um cliente com nome e e-mail válidos
- **THEN** a conta passa a aparecer na listagem de clientes do painel de admin
- **AND** ao autenticar pela primeira vez com aquele e-mail, a pessoa entra
  nessa mesma conta, com papel `cliente`

#### Scenario: E-mail já cadastrado

- **WHEN** um admin cadastra um cliente com um e-mail que já pertence a uma conta
- **THEN** a operação é recusada com erro de conflito
- **AND** nenhuma conta duplicada é criada

#### Scenario: Campos obrigatórios ausentes

- **WHEN** um cadastro de cliente é enviado sem e-mail ou sem nome
- **THEN** a operação é recusada com erro de validação identificando o campo

#### Scenario: Somente admin cadastra cliente

- **WHEN** um cliente autenticado tenta cadastrar outra conta de cliente
- **THEN** a operação é recusada por falta de autorização

### Requirement: Listagem de clientes no painel de admin

O painel de admin MUST listar todas as contas de cliente com nome, e-mail,
situação (aguardando primeiro acesso ou ativa) e a quantidade de eventos em que
cada uma é anfitriã.

#### Scenario: Lista reflete o provisionamento

- **WHEN** um admin cadastra um novo cliente
- **THEN** ele aparece na listagem com situação "aguardando primeiro acesso" e
  zero eventos

#### Scenario: Situação muda após o primeiro login

- **WHEN** um cliente provisionado autentica pela primeira vez
- **THEN** sua situação na listagem passa a "ativa"

#### Scenario: Listagem restrita ao admin

- **WHEN** um cliente autenticado requisita a listagem de clientes por qualquer
  rota
- **THEN** recebe erro de autorização e nenhum dado é retornado

### Requirement: Criação de página de evento pelo admin

O sistema MUST permitir que um admin crie uma página de evento informando tipo,
título, data, local, cidade, anfitriões e a **conta de cliente anfitriã**. A
página MUST nascer em rascunho, com aquele cliente como anfitrião.

#### Scenario: Página criada e atribuída

- **WHEN** um admin cria uma página de evento e escolhe um cliente como anfitrião
- **THEN** o evento é criado em rascunho vinculado a esse cliente
- **AND** o painel daquele cliente passa a listar o evento

#### Scenario: Anfitrião inexistente

- **WHEN** um admin cria uma página apontando para uma conta de cliente que não
  existe
- **THEN** a operação é recusada com erro de validação

#### Scenario: Cliente não cria página

- **WHEN** um cliente autenticado tenta criar uma página de evento por qualquer
  rota
- **THEN** a operação é recusada por falta de autorização
- **AND** nenhum evento é gravado

### Requirement: Reenvio do e-mail de acesso ao painel pelo admin

O painel de admin MUST permitir que um admin dispare manualmente, a partir da
listagem de clientes, o e-mail de acesso ao painel de uma conta de cliente já
provisionada. A mensagem MUST ser endereçada ao e-mail da conta e MUST referir-se
ao evento mais recente em que essa conta é anfitriã, contendo o endereço público
da página desse evento e a instrução de login. O disparo MUST enfileirar a
mensagem sem bloquear a resposta da requisição.

#### Scenario: Admin reenvia o acesso a um cliente com evento

- **WHEN** um admin aciona "Enviar e-mail de acesso" para um cliente que é
  anfitrião de pelo menos um evento
- **THEN** uma mensagem de acesso ao painel é enfileirada para o e-mail da conta
- **AND** a requisição responde sem aguardar a entrega
- **AND** o admin recebe a confirmação de que o e-mail foi enfileirado

#### Scenario: Cliente sem evento não pode receber o acesso

- **WHEN** um admin tenta enviar o e-mail de acesso a um cliente que não é
  anfitrião de nenhum evento
- **THEN** a operação é recusada informando que não há página para referenciar
- **AND** nenhuma mensagem é enfileirada

#### Scenario: Conta inexistente

- **WHEN** um admin dispara o e-mail de acesso para um id de cliente que não
  existe ou não é uma conta de cliente
- **THEN** a operação é recusada com erro identificando a conta inválida

#### Scenario: Somente admin dispara o reenvio

- **WHEN** um cliente autenticado ou um visitante tenta disparar o e-mail de
  acesso ao painel de uma conta
- **THEN** a operação é recusada por falta de autorização
