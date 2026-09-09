## MODIFIED Requirements

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
