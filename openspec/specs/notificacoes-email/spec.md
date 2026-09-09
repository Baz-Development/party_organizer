## Requirements

### Requirement: Envio assíncrono com novas tentativas

Toda mensagem MUST ser enfileirada e enviada fora do ciclo da requisição, com novas
tentativas em falhas temporárias e um limite de tentativas após o qual a mensagem é
marcada como falha permanente.

#### Scenario: Requisição não espera o envio

- **WHEN** o anfitrião dispara convites em lote
- **THEN** a requisição responde sem aguardar a entrega das mensagens
- **AND** as mensagens ficam registradas como pendentes

#### Scenario: Falha temporária do provedor

- **WHEN** o provedor recusa temporariamente uma mensagem
- **THEN** o envio é retentado com intervalo crescente
- **AND** a mensagem permanece pendente até o limite de tentativas

#### Scenario: Falha permanente

- **WHEN** o limite de tentativas é atingido
- **THEN** a mensagem é marcada como falha
- **AND** o motivo fica disponível a quem administra o evento

#### Scenario: Provedor indisponível não derruba a operação

- **WHEN** o provedor de e-mail está fora do ar
- **THEN** a ação que originou a mensagem (convite, RSVP, pagamento) permanece
  concluída com sucesso

### Requirement: Modelos de mensagem do produto

O sistema MUST oferecer modelos para convite com link de RSVP, lembrete de RSVP,
confirmação de resposta, recibo de presente, link de revelação do amigo secreto e
link de acesso ao painel, cada um identificando o evento e o remetente.

O modelo de acesso ao painel MUST conter, além do link do painel: o título do
evento, o endereço público da página do evento e a identificação de login do
cliente (o e-mail de acesso e onde solicitar o link de entrada). O modelo MUST
NOT conter senha, token de sessão ou qualquer segredo que dispense a
autenticação normal.

#### Scenario: Convite contém o link correto

- **WHEN** um convite é enviado a um convidado
- **THEN** a mensagem contém o link do evento com o token daquele convidado

#### Scenario: Confirmação após RSVP

- **WHEN** um convidado com e-mail cadastrado confirma presença
- **THEN** recebe uma confirmação com os dados da própria resposta

#### Scenario: Recibo após pagamento confirmado

- **WHEN** um pagamento de presente é confirmado
- **THEN** o pagador recebe um recibo com o presente e o valor

#### Scenario: Revelação do amigo secreto

- **WHEN** o sorteio é realizado
- **THEN** cada participante com e-mail recebe o link da própria revelação
- **AND** a mensagem não contém o nome da pessoa sorteada

#### Scenario: Acesso ao painel identifica página e login

- **WHEN** o e-mail de acesso ao painel é enviado ao cliente anfitrião
- **THEN** a mensagem contém o título do evento e o endereço público da página
- **AND** contém o e-mail de acesso do cliente e a instrução de solicitar o link
  de entrada em `/entrar`
- **AND** contém o link do painel

#### Scenario: Acesso ao painel não expõe segredo

- **WHEN** o e-mail de acesso ao painel é gerado
- **THEN** nenhuma senha ou token de sessão aparece no corpo da mensagem
- **AND** o cliente ainda precisa autenticar pelo link mágico para entrar

### Requirement: Ambientes não enviam para endereços reais

Fora de produção o sistema MUST NOT entregar mensagens a endereços reais,
redirecionando-as para um destino de teste ou descartando-as conforme a
configuração do ambiente.

#### Scenario: Disparo em ambiente local

- **WHEN** convites são disparados com `APP_ENV` igual a local
- **THEN** nenhuma mensagem chega ao endereço do convidado
- **AND** o conteúdo fica inspecionável pelo mecanismo de teste do ambiente

#### Scenario: Disparo em staging

- **WHEN** mensagens são disparadas em staging
- **THEN** todas vão para o destino de teste configurado

#### Scenario: Configuração ausente

- **WHEN** a aplicação inicia sem a chave do provedor ou o remetente definidos
- **THEN** a inicialização falha nomeando a variável faltante

### Requirement: Disparo em lote com acompanhamento

O sistema MUST permitir disparar convites para vários convidados de uma vez e MUST
apresentar, por convidado, se a mensagem está pendente, foi entregue ou falhou.

#### Scenario: Lote parcialmente falho

- **WHEN** parte das mensagens de um lote falha permanentemente
- **THEN** as demais permanecem entregues
- **AND** a lista identifica quais convidados não receberam

#### Scenario: Convidado sem e-mail

- **WHEN** um lote inclui convidados sem e-mail cadastrado
- **THEN** eles são reportados como não enviáveis
- **AND** o restante do lote é processado

#### Scenario: Reenvio

- **WHEN** o anfitrião reenvia o convite a um convidado que já recebeu
- **THEN** uma nova mensagem é enfileirada
- **AND** o link continua sendo o mesmo token daquele convidado

#### Scenario: Disparo restrito

- **WHEN** alguém sem vínculo com o evento tenta disparar convites
- **THEN** a operação é recusada por falta de autorização

### Requirement: Supressão de endereços

O sistema MUST parar de enviar para endereços que retornaram falha permanente ou que
pediram descadastro, e MUST manter o registro dessa supressão.

#### Scenario: Retorno permanente

- **WHEN** o provedor informa que um endereço não existe
- **THEN** esse endereço é suprimido
- **AND** novos envios para ele não são tentados

#### Scenario: Descadastro

- **WHEN** uma pessoa usa o link de descadastro de uma mensagem
- **THEN** ela deixa de receber mensagens não essenciais daquele evento

#### Scenario: Mensagem essencial após descadastro

- **WHEN** um recibo de pagamento é gerado para um endereço descadastrado de
  comunicações do evento
- **THEN** o recibo ainda é enviado, por ser resposta direta a uma ação da pessoa

### Requirement: Registro de entrega sem exposição de segredo

O sistema MUST registrar destinatário, modelo, estado e data de cada mensagem, e
MUST NOT gravar em registros de log o corpo com tokens de convite ou links de
revelação.

#### Scenario: Auditoria de envio

- **WHEN** quem administra o evento consulta o histórico de mensagens
- **THEN** vê destinatário, tipo de mensagem, estado e data

#### Scenario: Token fora do log

- **WHEN** uma mensagem com link de convite ou de revelação é enviada
- **THEN** o token não aparece em nenhum registro de log da aplicação

#### Scenario: Histórico restrito ao evento

- **WHEN** um membro de outra organização consulta o histórico de mensagens deste
  evento
- **THEN** a operação é recusada
