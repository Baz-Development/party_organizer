## ADDED Requirements

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
