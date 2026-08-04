## Requirements

### Requirement: Adesão de participante

O sistema MUST permitir que uma pessoa entre no amigo secreto de um evento publicado
com o módulo habilitado, informando nome, enquanto o sorteio não tiver sido
realizado.

#### Scenario: Participante cadastrado

- **WHEN** uma pessoa envia seu nome na tela de cadastro antes do sorteio
- **THEN** ela passa a constar como participante daquele evento
- **AND** a data de entrada é registrada

#### Scenario: Adesão após o sorteio

- **WHEN** alguém tenta entrar depois de o sorteio ter sido realizado
- **THEN** a operação é recusada com aviso de sorteio já realizado

#### Scenario: Nome duplicado

- **WHEN** um nome já presente na lista é enviado novamente
- **THEN** a operação é recusada informando o conflito

#### Scenario: Módulo desabilitado

- **WHEN** uma adesão é enviada a um evento com o módulo desabilitado
- **THEN** a operação é recusada

### Requirement: Lista de desejos

Cada participante MUST poder registrar e editar sua lista de desejos até o momento da
revelação, e a lista MUST ser visível apenas a quem o tirou.

#### Scenario: Lista editada

- **WHEN** um participante identificado altera sua lista de desejos
- **THEN** a alteração é persistida

#### Scenario: Lista visível a quem tirou

- **WHEN** um participante revela quem tirou
- **THEN** vê a lista de desejos da pessoa sorteada

#### Scenario: Lista não é pública

- **WHEN** um visitante requisita a lista de desejos de um participante
- **THEN** a operação é recusada

### Requirement: Restrições de par

O sistema MUST permitir registrar pares que não podem ser sorteados juntos e MUST
respeitá-los na execução do sorteio.

#### Scenario: Restrição respeitada

- **WHEN** o sorteio é executado com uma restrição entre dois participantes
- **THEN** nenhum dos dois tira o outro

#### Scenario: Restrições sem solução

- **WHEN** as restrições tornam impossível qualquer distribuição válida
- **THEN** o sorteio falha com mensagem explicando a impossibilidade
- **AND** nenhum par é gravado

### Requirement: Sorteio válido

O sorteio MUST atribuir a cada participante exatamente uma pessoa, cada pessoa MUST
ser sorteada exatamente uma vez, e nenhum participante MUST tirar a si mesmo.

#### Scenario: Distribuição completa

- **WHEN** o sorteio é executado com os participantes cadastrados
- **THEN** cada participante tem exatamente um sorteado
- **AND** cada participante é sorteado por exatamente uma pessoa

#### Scenario: Ninguém tira a si mesmo

- **WHEN** o sorteio é executado
- **THEN** nenhum par tem a mesma pessoa como sorteador e sorteado

#### Scenario: Participantes insuficientes

- **WHEN** o sorteio é executado com menos de três participantes
- **THEN** a operação é recusada informando o mínimo necessário

#### Scenario: Resultado não previsível

- **WHEN** o sorteio é executado repetidas vezes com o mesmo grupo
- **THEN** a distribuição não segue a ordem de cadastro nem outra ordem previsível

### Requirement: Sorteio executado uma única vez

O sistema MUST executar o sorteio de um evento uma única vez de forma atômica, e MUST
recusar execuções concorrentes ou repetidas.

#### Scenario: Execuções concorrentes

- **WHEN** duas requisições de sorteio do mesmo evento chegam ao mesmo tempo
- **THEN** apenas uma produz o resultado
- **AND** a outra é recusada informando que o sorteio já ocorreu

#### Scenario: Falha no meio da execução

- **WHEN** a execução do sorteio falha após gravar parte dos pares
- **THEN** nenhum par permanece gravado
- **AND** o evento continua sem sorteio realizado

#### Scenario: Somente quem administra sorteia

- **WHEN** um participante tenta disparar o sorteio
- **THEN** a operação é recusada por falta de autorização

### Requirement: Sigilo dos pares

O resultado do sorteio MUST NOT ser legível por ninguém além do próprio participante
sorteador, incluindo quem administra o evento, os membros da organização e os admins
da plataforma.

#### Scenario: Participante revela apenas o próprio par

- **WHEN** um participante identificado abre a revelação
- **THEN** vê apenas quem ele tirou

#### Scenario: Anfitrião não vê os pares

- **WHEN** quem administra o evento consulta o amigo secreto por qualquer rota
- **THEN** vê apenas quantos participantes existem e se o sorteio já ocorreu
- **AND** nenhum par é revelado

#### Scenario: Par de outro participante

- **WHEN** um participante tenta consultar o par de outra pessoa
- **THEN** a operação é recusada

#### Scenario: Pares fora de registros e mensagens de erro

- **WHEN** o sistema registra logs ou devolve mensagens de erro do módulo
- **THEN** nenhum par sorteado aparece no conteúdo registrado ou devolvido

### Requirement: Revelação individual

O sistema MUST registrar quando cada participante revelou seu par, e a revelação MUST
permanecer disponível para consulta posterior pelo mesmo participante.

#### Scenario: Primeira revelação

- **WHEN** um participante abre a revelação pela primeira vez
- **THEN** vê quem tirou e a data da revelação é registrada

#### Scenario: Nova consulta

- **WHEN** o mesmo participante volta à tela de revelação
- **THEN** vê o mesmo par de antes

#### Scenario: Revelação antes do sorteio

- **WHEN** um participante abre a revelação antes de o sorteio ocorrer
- **THEN** vê aviso de que o sorteio ainda não foi realizado

### Requirement: Refazer o sorteio antes de qualquer revelação

O sistema MUST permitir a quem administra o evento refazer o sorteio enquanto nenhum
participante tiver revelado seu par, e MUST recusar depois da primeira revelação.

#### Scenario: Refazer sem revelações

- **WHEN** quem administra refaz o sorteio e ninguém revelou ainda
- **THEN** a distribuição anterior é descartada e uma nova é gravada

#### Scenario: Refazer após revelação

- **WHEN** quem administra tenta refazer o sorteio depois de alguém ter revelado
- **THEN** a operação é recusada
- **AND** a distribuição existente permanece intacta
