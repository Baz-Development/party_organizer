## ADDED Requirements

### Requirement: Checkout com valor determinado pelo servidor

O valor a pagar MUST ser calculado no servidor a partir do presente ou da cota
escolhida. O sistema MUST NOT aceitar valor, moeda ou identificador de destino
enviados pelo cliente.

#### Scenario: Valor íntegro

- **WHEN** um convidado inicia o checkout de um presente
- **THEN** a cobrança criada usa o preço registrado no banco para aquele presente

#### Scenario: Valor adulterado na requisição

- **WHEN** a requisição de checkout inclui um valor diferente do preço do presente
- **THEN** o valor enviado é ignorado e a cobrança usa o preço do banco

#### Scenario: Presente indisponível

- **WHEN** o checkout é iniciado para um presente já comprado ou reservado por outra
  pessoa
- **THEN** a operação é recusada antes de qualquer cobrança ser criada

### Requirement: Confirmação exclusivamente por webhook assinado

O sistema MUST tratar um pagamento como confirmado somente ao receber notificação do
provedor com assinatura válida. O retorno do navegador à tela de sucesso MUST NOT
ser aceito como prova de pagamento.

#### Scenario: Webhook válido

- **WHEN** chega uma notificação de pagamento aprovado com assinatura válida
- **THEN** o pagamento é marcado como confirmado
- **AND** o presente correspondente passa a comprado, ou a cota tem o valor somado

#### Scenario: Assinatura inválida

- **WHEN** chega uma notificação com assinatura ausente ou inválida
- **THEN** ela é descartada sem alterar nenhum estado
- **AND** o descarte é registrado para auditoria

#### Scenario: Retorno do navegador sem webhook

- **WHEN** o convidado chega à tela de sucesso antes de o webhook ser processado
- **THEN** a tela informa que a confirmação está em processamento
- **AND** o presente ainda não consta como comprado

#### Scenario: Pagamento recusado

- **WHEN** chega uma notificação de pagamento recusado ou expirado
- **THEN** o pagamento é marcado como falho
- **AND** a reserva do presente é liberada

### Requirement: Idempotência do processamento de notificações

O sistema MUST processar cada evento de pagamento no máximo uma vez, mesmo que o
provedor reentregue a mesma notificação.

#### Scenario: Notificação duplicada

- **WHEN** a mesma notificação de pagamento aprovado é entregue duas vezes
- **THEN** o efeito no presente e no valor arrecadado ocorre uma única vez
- **AND** a segunda entrega é respondida como aceita

#### Scenario: Notificações fora de ordem

- **WHEN** uma notificação mais antiga chega depois de uma mais recente do mesmo
  pagamento
- **THEN** o estado final corresponde à notificação mais recente

### Requirement: Reembolso e estorno

O sistema MUST reverter o efeito de um pagamento quando receber notificação de
reembolso ou estorno, devolvendo o presente ou a cota ao estado anterior.

#### Scenario: Reembolso de presente único

- **WHEN** um pagamento confirmado de um presente é reembolsado
- **THEN** o presente volta ao estado disponível
- **AND** sai do total arrecadado do evento

#### Scenario: Reembolso de contribuição de cota

- **WHEN** uma contribuição de cota é reembolsada
- **THEN** o valor arrecadado da cota é reduzido no valor reembolsado
- **AND** se a cota estava completa, ela volta a aceitar contribuições

### Requirement: Rastro de auditoria dos pagamentos

O sistema MUST persistir cada pagamento com identificador do provedor, valor, moeda,
estado e evento associado, e MUST guardar o histórico bruto das notificações
recebidas.

#### Scenario: Conciliação

- **WHEN** quem administra o evento consulta um presente comprado
- **THEN** consegue chegar ao pagamento correspondente pelo identificador do provedor

#### Scenario: Dados de cartão nunca armazenados

- **WHEN** um pagamento é processado
- **THEN** nenhum dado de cartão ou credencial de pagamento é gravado pela aplicação

### Requirement: Acesso restrito aos dados de pagamento

Os registros de pagamento MUST ser legíveis apenas por quem administra o evento
correspondente e pelos admins da plataforma, e MUST NOT ser acessíveis ao público.

#### Scenario: Convidado não lê pagamentos

- **WHEN** um convidado requisita os pagamentos de um evento
- **THEN** a operação é recusada e nenhum registro é retornado

#### Scenario: Organização de outro evento

- **WHEN** um membro de outra organização requisita os pagamentos deste evento
- **THEN** a operação é recusada

### Requirement: Credenciais de pagamento por ambiente

As credenciais do provedor de pagamento MUST vir de variáveis de ambiente, com
credenciais de teste em local e staging e credenciais reais apenas em produção.

#### Scenario: Ambiente local não cobra de verdade

- **WHEN** um checkout é iniciado com `APP_ENV` igual a local ou staging
- **THEN** a cobrança é criada no ambiente de teste do provedor

#### Scenario: Credencial ausente

- **WHEN** a aplicação inicia sem a credencial do provedor de pagamento definida
- **THEN** a inicialização falha nomeando a variável faltante
