## Why

A landing pública em `/` (`src/app/page.tsx` → `src/app/Landing.tsx`) tem a estrutura de funil correta, mas a execução trava a conversão: ícones da seção "Por que escolher a Convite" são caixas vazias, todos os elementos de prova social são placeholders cinza, o rodapé expõe links administrativos (`/painel`, `/admin`, `/rotas`) a qualquer visitante, e o hero fala 100% de casamento embora o produto atenda quatro segmentos. A análise em `analise-landing-page-convite.md` (08/09/2026) detalha cada ponto.

## What Changes

- **Corrige os ícones quebrados** da seção "Por que escolher a Convite": cada benefício passa a exibir um ícone real (SVG inline) no lugar do quadrado com borda dourada vazio.
- **Remove os links administrativos do rodapé público** (`Painel do cliente` → `/painel`, `Admin` → `/admin`, `Todas as telas` → `/rotas`). O acesso da equipe/cliente continua pelo "Entrar" no header; as rotas administrativas deixam de ser anunciadas na página pública. **BREAKING** para quem usa esses atalhos do rodapé.
- **Substitui os placeholders de prova social por imagens reais**: foto de capa do mockup do hero, mockup por segmento na seção "Feito para o seu tipo de festa" e avatares dos depoimentos. Enquanto não houver imagem real, o slot usa uma imagem neutra de marca (não um gradiente vazio com texto).
- **Adiciona faixa de logos de parceiros** (buffets / casas de eventos) para sustentar a alegação "Disponível em parceria com casas de eventos e buffets em todo o Brasil". Sem logos cadastradas, a faixa e a frase são omitidas.
- **Resolve o viés de casamento no hero**: o mockup e o texto do card do hero passam a alternar por segmento (Casamento / Debutante / Aniversário infantil / Corporativo), acompanhando a mesma seleção usada na seção "Feito para o seu tipo de festa", e um subtítulo/《pill》 sinaliza no topo que a solução cobre os quatro tipos + formatura.
- **Sobe a mensagem "sem mensalidade"** para logo abaixo do CTA principal do hero, como selo pequeno ("Preço por evento — sem mensalidade eterna").
- **Adiciona navegação âncora no header** (Como funciona · Tipos de festa · Planos · FAQ) com um CTA que fixa ao rolar, com bom comportamento em mobile.
- **Renomeia o plano "Corporativo"** para evitar colisão com o nome do segmento "Corporativo" das abas (ex.: "Empresas" ou "Sob medida").
- **Suaviza a transição de cor** creme → rodapé: o CTA final e o rodapé usam um tom escuro da mesma família (marrom‑carvão) em vez de preto puro.
- **Acrescenta 2 perguntas ao FAQ**: se convidados pagam algo / precisam de app, e se dá para usar domínio próprio no plano de empresas.
- **Garante que as 4 abas de tipo de festa realmente trocam conteúdo** (lista de recursos + mockup), cobrindo com teste.

## Capabilities

### New Capabilities
- `landing-page`: conteúdo, estrutura e comportamento da página pública `/` — hero por segmento, prova social (números, logos de parceiros, depoimentos), navegação âncora, planos, FAQ e CTA; incluindo a regra de não expor rotas autenticadas e de degradar com elegância quando não há imagem/parceiro/evento de exemplo.

### Modified Capabilities
<!-- Nenhuma capability existente tem requisitos alterados. -->

## Impact

- **Telas**: `/` — `src/app/page.tsx`, `src/app/Landing.tsx`.
- **Componentes**: `src/components/ImageSlot.tsx` (fallback neutro de marca), `src/components/Logo.tsx`, `src/components/ui` (`Pill`, `LinkButton`); novo componente de faixa de logos e de ícones de benefício.
- **Dados**: `src/lib/db/featured.ts` / `getShowcaseEvent` pode passar a expor mockups por segmento; possível nova fonte de "parceiros" (mock em `src/lib/mock-data.ts` até haver banco).
- **Assets**: novas imagens em `public/` (capa por segmento, logos de parceiros, avatares de depoimento) — sem fundo quando aplicável, seguindo o padrão da marca ALF Eventos.
- **Rotas de API**: nenhuma. Rotas administrativas (`/painel`, `/admin`, `/rotas`) não mudam de comportamento, apenas deixam de ser linkadas em `/`.
- **Testes**: novo teste para a troca de abas do segmento e para a ausência de links administrativos no rodapé.
- **SEO/marketing**: headline e subtítulo do hero, copy do FAQ e nome de plano.
