## ADDED Requirements

### Requirement: Sorteios do evento

O sistema MUST permitir que quem administra um evento com o módulo de sorteios habilitado crie, renomeie e exclua sorteios, podendo haver mais de um sorteio por evento.

#### Scenario: Sorteio criado

- **WHEN** a anfitriã cria um sorteio informando um nome
- **THEN** o sorteio passa a existir no evento, em preparação, sem prêmios nem participantes

#### Scenario: Módulo desabilitado

- **WHEN** um sorteio é criado, alterado ou conduzido num evento sem o módulo habilitado
- **THEN** a operação é recusada

#### Scenario: Somente quem administra o evento

- **WHEN** um convidado, um visitante ou a anfitriã de outro evento tenta ler, criar, alterar ou conduzir um sorteio
- **THEN** a operação é recusada e nenhum dado do sorteio é revelado

### Requirement: Prêmios e vencedores

O sistema MUST permitir que a anfitriã configure, para cada sorteio, uma lista ordenada de prêmios — cada um com nome, detalhes e foto opcionais e a quantidade de vencedores — e a quantidade de suplentes. A ordem da lista MUST ser a ordem em que os prêmios são sorteados.

#### Scenario: Prêmio com vários vencedores

- **WHEN** a anfitriã cadastra um prêmio com 3 vencedores
- **THEN** o sorteio passa a ter 3 vagas para aquele prêmio, sorteadas uma a uma

#### Scenario: Reordenar prêmios

- **WHEN** a anfitriã move um prêmio para o fim da lista
- **THEN** ele passa a ser o último sorteado

#### Scenario: Quantidade inválida

- **WHEN** um prêmio é enviado com zero vencedores ou quantidade negativa
- **THEN** a operação é recusada com erro de validação

#### Scenario: Só a anfitriã configura

- **WHEN** alguém que não administra o evento tenta cadastrar ou alterar um prêmio
- **THEN** a operação é recusada

### Requirement: Participantes vindos da lista de convidados

O sistema MUST permitir que a anfitriã escolha os participantes de um sorteio entre os convidados do próprio evento, de três formas: marcando-os um a um, incluindo todos os convidados, ou incluindo só os que confirmaram presença. Nas duas formas automáticas, a lista MUST ser montada no momento em que o sorteio começa.

#### Scenario: Todos os convidados participam

- **WHEN** a anfitriã escolhe "todos os convidados" e começa o sorteio
- **THEN** concorrem todos os convidados cadastrados no evento até aquele momento, inclusive os cadastrados depois de ela escolher o modo

#### Scenario: Só os confirmados participam

- **WHEN** a anfitriã escolhe "só os confirmados" e começa o sorteio
- **THEN** concorrem exatamente os convidados com presença confirmada naquele momento

#### Scenario: Nenhum convidado elegível

- **WHEN** a anfitriã tenta começar um sorteio automático sem nenhum convidado que se encaixe no modo
- **THEN** a operação é recusada informando que não há convidados para o modo escolhido

#### Scenario: Modo travado após começar

- **WHEN** a anfitriã tenta mudar o modo de participação de um sorteio já começado
- **THEN** a operação é recusada informando que as inscrições estão bloqueadas

#### Scenario: Participantes selecionados

- **WHEN** a anfitriã marca convidados e salva
- **THEN** exatamente esses convidados passam a concorrer no sorteio

#### Scenario: Convidado de outro evento

- **WHEN** um convidado de outro evento é enviado como participante
- **THEN** a operação é recusada

#### Scenario: Convidado removido depois do sorteio

- **WHEN** um convidado já sorteado é removido da lista de convidados
- **THEN** o resultado do sorteio continua mostrando o nome dele

#### Scenario: Só a anfitriã escolhe participantes

- **WHEN** alguém que não administra o evento tenta incluir ou remover participantes
- **THEN** a operação é recusada

### Requirement: Bloqueio das inscrições ao começar

Ao começar um sorteio, o sistema MUST bloquear a inclusão e a remoção de participantes, a alteração de prêmios e a alteração de suplentes, até que o sorteio seja reaberto ou recomeçado.

#### Scenario: Inclusão após começar

- **WHEN** a anfitriã tenta incluir um participante num sorteio já começado
- **THEN** a operação é recusada informando que as inscrições estão bloqueadas

#### Scenario: Começar sem configuração

- **WHEN** a anfitriã tenta começar um sorteio sem prêmio ou sem participante
- **THEN** a operação é recusada informando o que falta

#### Scenario: Reabrir antes do primeiro nome

- **WHEN** a anfitriã reabre as inscrições de um sorteio começado em que ninguém foi sorteado
- **THEN** o sorteio volta a ficar em preparação e a lista pode ser alterada

#### Scenario: Reabrir depois do primeiro nome

- **WHEN** a anfitriã tenta reabrir um sorteio que já tem nomes sorteados
- **THEN** a operação é recusada, indicando recomeçar do zero

#### Scenario: Recomeçar do zero

- **WHEN** a anfitriã recomeça um sorteio
- **THEN** todos os resultados são descartados e as inscrições reabertas

#### Scenario: Só a anfitriã muda o estado

- **WHEN** alguém que não administra o evento tenta começar, reabrir, recomeçar ou encerrar um sorteio
- **THEN** a operação é recusada

### Requirement: Sorteio decidido no servidor

O sistema MUST escolher cada vencedor no servidor, de forma aleatória e imprevisível, preenchendo as vagas na ordem dos prêmios e depois os suplentes, sem nunca sortear a mesma pessoa duas vezes no mesmo sorteio. Nenhum cliente MUST conseguir gravar um resultado escolhido por ele.

#### Scenario: Ordem das vagas

- **WHEN** a anfitriã sorteia repetidas vezes
- **THEN** as vagas do primeiro prêmio são preenchidas antes das do segundo, e os suplentes por último

#### Scenario: Ninguém sai duas vezes

- **WHEN** todos os sorteios de um sorteio são feitos
- **THEN** cada pessoa aparece no máximo uma vez nos resultados

#### Scenario: Cliques simultâneos

- **WHEN** duas requisições de sorteio do mesmo sorteio chegam ao mesmo tempo
- **THEN** cada uma preenche uma vaga diferente com uma pessoa diferente

#### Scenario: Encerramento automático

- **WHEN** a última vaga é preenchida
- **THEN** o sorteio fica encerrado e novos sorteios são recusados

#### Scenario: Urna vazia

- **WHEN** não há mais participantes para as vagas restantes
- **THEN** o sorteio é recusado informando que a urna acabou, e a anfitriã pode encerrar

#### Scenario: Resultado escolhido pelo cliente

- **WHEN** a anfitriã tenta gravar um resultado diretamente
- **THEN** a operação é recusada

#### Scenario: Antes de começar

- **WHEN** a anfitriã tenta sortear um sorteio em preparação
- **THEN** a operação é recusada

### Requirement: Vencedor ausente

O sistema MUST permitir marcar um sorteado como ausente, liberando a vaga do prêmio para um novo sorteio sem devolver o nome à urna.

#### Scenario: Marcar ausente

- **WHEN** a anfitriã marca o vencedor de um prêmio como ausente
- **THEN** o próximo sorteio volta a valer aquele prêmio
- **AND** a pessoa ausente não é sorteada de novo

#### Scenario: Sorteio já encerrado

- **WHEN** o último vencedor é marcado como ausente
- **THEN** o sorteio volta a ficar em andamento para preencher a vaga

#### Scenario: Só a anfitriã marca ausente

- **WHEN** alguém que não administra o evento tenta marcar um resultado como ausente
- **THEN** a operação é recusada

### Requirement: Tela de apresentação

O sistema MUST oferecer à anfitriã uma tela de apresentação do sorteio, própria para projetar ou compartilhar, com a identidade visual do evento, que anima a escolha até revelar o vencedor e o prêmio, e que possa ser conduzida sem treinamento.

#### Scenario: Uma ação por vez

- **WHEN** a anfitriã abre a tela
- **THEN** há um único botão principal com a próxima ação (começar, sortear, próximo), também acionado pela barra de espaço

#### Scenario: Suspense antes da revelação

- **WHEN** a anfitriã sorteia
- **THEN** os nomes da urna giram e desaceleram até parar no vencedor antes de o nome ser revelado com o prêmio

#### Scenario: Retomada após recarregar

- **WHEN** a tela é recarregada no meio de um sorteio
- **THEN** os resultados já sorteados são mantidos e o sorteio continua do próximo prêmio

#### Scenario: Quadro final

- **WHEN** todas as vagas foram preenchidas
- **THEN** a tela mostra todos os ganhadores com seus prêmios e os suplentes

#### Scenario: Tela restrita à anfitriã

- **WHEN** alguém sem acesso ao painel do evento abre a tela de apresentação
- **THEN** é redirecionado para entrar e nenhum dado do sorteio é exibido
