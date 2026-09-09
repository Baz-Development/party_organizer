## Context

A landing pública vive em `src/app/page.tsx` (Server Component que busca `getShowcaseEvent`) e `src/app/Landing.tsx` (Client Component com estado de aba e FAQ). Todo o conteúdo é constante no próprio arquivo (`STEPS`, `EVENT_TYPES`, `BENEFITS`, `TESTIMONIALS`, `PLANS`, `FAQS`). Imagens usam `<ImageSlot>`, que hoje renderiza um gradiente com texto de placeholder. Não há banco: dados dinâmicos passariam por `src/lib/mock-data.ts` / `src/lib/db/*` seguindo o padrão atual (`persisted: false`).

A análise `analise-landing-page-convite.md` (08/09/2026) é a origem dos requisitos. As mudanças são de front-end e conteúdo; nenhuma toca API, RLS ou schema.

## Goals / Non-Goals

**Goals:**
- Eliminar sinais de "inacabado": ícones vazios, placeholders de dev, links administrativos públicos.
- Tornar o hero relevante para os quatro segmentos, não só casamento.
- Reduzir fricção de navegação e reforçar o diferencial de preço.
- Manter tudo funcionando sem banco, degradando com elegância quando faltam imagens/parceiros/evento de exemplo.

**Non-Goals:**
- Criar CMS ou painel para editar a landing.
- Implementar upload/gestão de logos de parceiros via banco (fica em mock até haver Storage).
- Redesenhar a identidade visual (paleta ALF Eventos permanece — ver [[marca-alf-eventos]]).
- Alterar comportamento de `/painel`, `/admin`, `/rotas` ou do fluxo de login.

## Decisions

### 1. Conteúdo continua em constantes no arquivo, com mockup por segmento

`EVENT_TYPES` passa a incluir, além de `label` e `features`, uma referência de imagem de mockup e o texto do card do hero (título + linha secundária) por segmento. O hero lê do mesmo estado `eventType` já existente em `Landing.tsx`, elevando a seleção para valer tanto no hero quanto na seção de segmentação.

- **Alternativa considerada**: buscar mockups do banco via `getShowcaseEvent` por tipo. Rejeitada agora — não há banco populado e a landing precisa funcionar offline. A estrutura fica pronta para trocar a fonte depois.

### 2. `ImageSlot` ganha fallback neutro de marca

`src/components/ImageSlot.tsx` passa a aceitar `src` opcional. Com `src`, renderiza a imagem (`next/image`). Sem `src`, renderiza um preenchimento sólido/sutil da paleta (creme/dourado) sem texto de placeholder. A prop `placeholder` de texto deixa de ser exibida em produção (pode virar `aria-label`/comentário).

- **Alternativa considerada**: manter texto do placeholder só em `NODE_ENV !== 'production'`. Rejeitada — a análise pede que o mockup do hero, que é a primeira coisa vista, nunca apareça vazio; um bloco neutro é melhor que texto de debug em qualquer ambiente.

### 3. Ícones de benefício via SVG inline

Novo módulo com um pequeno conjunto de ícones SVG (traço, `currentColor`) mapeados por benefício em `BENEFITS`. Sem dependência externa. Cada item de `BENEFITS` ganha uma chave `icon`.

- **Alternativa considerada**: biblioteca de ícones (lucide-react). Evitada para não adicionar dependência por 5 ícones; pode ser revista se o resto do produto adotar uma.

### 4. Faixa de logos de parceiros a partir de lista mock

Nova constante `PARTNERS` (mock em `src/lib/mock-data.ts`), lida por `page.tsx` e passada como prop. Vazia → nem a faixa nem a frase "Disponível em parceria..." renderizam. Assets em `public/parceiros/` sem fundo, seguindo o padrão de `src/components/Logo.tsx`.

### 5. Navegação âncora + CTA aderente

Seções ganham `id` (`como-funciona`, `tipos-de-festa`, `planos`, `faq`). Header ganha `<nav>` com links âncora e `scroll-behavior: smooth`. Em mobile, os links âncora colapsam num menu simples ou barra rolável; um CTA compacto fixa no rodapé da viewport após o hero (via `IntersectionObserver` no sentinel do hero, sem libs).

- **Alternativa considerada**: header inteiro `sticky`. Rejeitada — ocupa espaço vertical precioso em mobile; um CTA flutuante isolado converte sem custo de layout.

### 6. Renomear plano e ajustar tom do rodapé

`PLANS[2].name`: "Corporativo" → "Empresas". CTA final e rodapé trocam `bg-ink` puro por um token marrom‑carvão da mesma família (definir `--color-ink-charcoal` ou reutilizar o mais escuro da paleta ALF em `globals.css`/`themes.ts`).

### 7. FAQ: +2 perguntas

Adicionar a `FAQS`: (a) "Meus convidados pagam alguma coisa ou precisam de aplicativo?" e (b) "Posso usar meu próprio domínio?" (resposta amarrada ao plano Empresas).

## Risks / Trade-offs

- **[Conteúdo mockado de segmento pode divergir do produto real]** → manter os textos genéricos e verificáveis; marcar `PARTNERS`/mockups como placeholder de marketing até haver material real.
- **[CTA flutuante atrapalhando leitura em telas pequenas]** → esconder quando a seção de planos ou o footer estão visíveis; respeitar `prefers-reduced-motion` no scroll suave.
- **[Remover links do rodapé quebra atalho de quem testava as telas]** → `/rotas`, `/painel`, `/admin` continuam acessíveis por URL direta; documentar no `guide.md`.
- **[`next/image` exige config de domínios/loader]** → como as imagens ficam em `public/`, não há host externo; confirmar no guia do Next 16 em `node_modules/next/dist/docs/` antes de codar.
- **Variáveis de ambiente**: nenhuma nova. Sem novas tabelas, sem RLS. `getShowcaseEvent` continua sendo a única leitura de banco da página.

## Migration Plan

1. Ajustes de front-end e conteúdo em `Landing.tsx` / `ImageSlot.tsx` / novos componentes.
2. Adicionar assets em `public/` (ou deixar fallback neutro se ainda não houver).
3. Rodar `tests/` — incluir o novo teste de abas e de ausência de links administrativos.
4. Deploy padrão da app. Rollback = reverter o commit; nada de dados/migrations envolvido.

## Open Questions

- Nome definitivo do plano de empresas: "Empresas" ou "Sob medida"?
- Vamos ter logos/depoimentos reais a tempo, ou entra tudo com fallback neutro nesta primeira versão?
- O CTA flutuante deve levar a `/onboarding` (informativo) ou direto ao "Entrar"? Hoje toda a landing aponta para `/onboarding`.
