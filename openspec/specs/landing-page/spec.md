# landing-page Specification

## Purpose
TBD - created by archiving change improve-landing-page-convite. Update Purpose after archive.

Cobre o conteúdo, a estrutura e o comportamento da página pública `/`
(`src/app/page.tsx` → `src/app/Landing.tsx`): hero por segmento, prova social
(números, logos de parceiros, depoimentos), navegação âncora, planos, FAQ e CTA,
incluindo a regra de não expor rotas autenticadas e de degradar com elegância
quando não há imagem, parceiro ou evento de exemplo.

## Requirements

### Requirement: Página pública não expõe rotas autenticadas

A landing em `/` (`src/app/Landing.tsx`) SHALL apresentar, para um visitante não autenticado, apenas caminhos públicos. Links diretos para `/painel`, `/admin` e `/rotas` MUST NOT aparecer no corpo da página nem no rodapé. O único ponto de entrada para áreas autenticadas SHALL ser o botão "Entrar" no header, que leva ao fluxo de login (magic link).

#### Scenario: Visitante não vê links administrativos no rodapé

- **WHEN** um visitante não autenticado carrega `/`
- **THEN** o rodapé exibe o logo e links institucionais/públicos
- **AND** não contém link para `/painel`, `/admin` ou `/rotas`

#### Scenario: Acesso da equipe continua disponível

- **WHEN** um membro da equipe ou cliente quer acessar sua área
- **THEN** usa o botão "Entrar" no header
- **AND** é levado ao fluxo de autenticação por magic link

### Requirement: Ícones de benefício renderizados

A seção "Por que escolher a Convite" SHALL exibir, para cada benefício, um ícone gráfico visível (SVG) associado ao texto do benefício. Um contêiner de ícone vazio (apenas borda) MUST NOT ser exibido.

#### Scenario: Todos os benefícios têm ícone

- **WHEN** o visitante rola até a seção "Por que escolher a Convite"
- **THEN** cada cartão de benefício mostra um ícone não vazio acima do título
- **AND** o ícone tem contraste suficiente para ser percebido sobre o fundo

### Requirement: Hero adapta-se ao segmento selecionado

O hero SHALL refletir o tipo de festa selecionado pelo visitante. Ao trocar o segmento (Casamento / Debutante / Aniversário infantil / Corporativo), o mockup e o texto do card do hero MUST mudar para conteúdo correspondente ao segmento. O topo da página SHALL sinalizar, em texto, que a solução atende os quatro segmentos e formatura, independentemente do segmento ativo.

#### Scenario: Trocar o segmento atualiza o hero

- **WHEN** o visitante seleciona "Aniversário infantil"
- **THEN** o card do hero mostra um mockup e um título coerentes com festa infantil
- **AND** a lista de recursos da seção "Feito para o seu tipo de festa" também reflete "Aniversário infantil"

#### Scenario: Segmento padrão

- **WHEN** o visitante carrega `/` sem interagir
- **THEN** um segmento padrão é exibido no hero
- **AND** o subtítulo/rótulo do topo cita casamento, debutante, aniversário infantil, corporativo e formatura

### Requirement: As quatro abas de tipo de festa trocam conteúdo

A seção "Feito para o seu tipo de festa" SHALL oferecer as quatro abas e cada aba MUST exibir sua própria lista de recursos e seu próprio mockup. Nenhuma aba pode repetir o conteúdo de outra por falta de dados.

#### Scenario: Cada aba tem conteúdo próprio

- **WHEN** o visitante seleciona sucessivamente Casamento, Debutante, Aniversário infantil e Corporativo
- **THEN** a lista de recursos exibida muda a cada seleção
- **AND** o mockup exibido corresponde à aba ativa

### Requirement: Prova social degrada com elegância

Os elementos de prova social (foto de capa do hero, mockups por segmento, avatares de depoimento, logos de parceiros) SHALL usar imagens reais quando disponíveis. Quando uma imagem real não estiver disponível, o slot SHALL exibir um preenchimento neutro de marca — nunca um gradiente vazio com texto de placeholder de desenvolvimento.

#### Scenario: Sem imagem real cadastrada

- **WHEN** não há imagem real para um slot de prova social
- **THEN** o slot mostra um preenchimento neutro consistente com a identidade da marca
- **AND** não exibe texto do tipo "Mockup —" ou "Foto de capa"

#### Scenario: Sem parceiros cadastrados

- **WHEN** não há nenhuma logo de parceiro disponível
- **THEN** a faixa de logos de parceiros e a frase de parceria não são renderizadas

#### Scenario: Sem evento de exemplo publicado

- **WHEN** não existe evento de exemplo publicado
- **THEN** o botão "Ver exemplo ao vivo" não é exibido

### Requirement: Navegação âncora no header

O header da landing SHALL oferecer navegação âncora para as seções principais (Como funciona, Tipos de festa, Planos, FAQ) e um CTA de criação de página que permanece acessível ao rolar. A navegação MUST ser utilizável em telas de largura de celular.

#### Scenario: Pular para uma seção

- **WHEN** o visitante clica em "Planos" no header
- **THEN** a página rola até a seção de planos

#### Scenario: CTA acessível ao rolar

- **WHEN** o visitante rola além do hero
- **THEN** um CTA para criar a página do evento continua visível ou alcançável sem voltar ao topo

### Requirement: Mensagem de preço sem mensalidade no hero

O hero SHALL exibir, próximo ao CTA principal, um selo curto comunicando "preço por evento, sem mensalidade". A seção de planos SHALL manter a mesma mensagem.

#### Scenario: Selo visível no primeiro dobra

- **WHEN** o visitante carrega `/`
- **THEN** vê, junto ao CTA do hero, a mensagem de preço por evento sem mensalidade

### Requirement: Nomenclatura de plano sem colisão com segmento

O nome do plano voltado a empresas MUST ser diferente do rótulo do segmento "Corporativo" usado nas abas de tipo de festa.

#### Scenario: Plano de empresas não se chama "Corporativo"

- **WHEN** o visitante lê a seção de planos
- **THEN** o plano para empresas tem um nome distinto do segmento "Corporativo"

### Requirement: FAQ cobre objeções de convidado e de empresa

O FAQ SHALL incluir uma pergunta sobre se convidados pagam algo ou precisam de aplicativo, e uma pergunta sobre uso de domínio próprio no plano de empresas, além das perguntas atuais.

#### Scenario: Pergunta sobre custo para convidados

- **WHEN** o visitante abre o FAQ
- **THEN** encontra uma pergunta esclarecendo que convidados não pagam e não precisam instalar app

#### Scenario: Pergunta sobre domínio próprio

- **WHEN** o visitante abre o FAQ
- **THEN** encontra uma pergunta sobre domínio próprio no plano de empresas
