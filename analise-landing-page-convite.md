# Análise de Design, UX e Marketing — Landing Page "Convite"

**Página analisada:** `localhost:3000` — "A festa dos seus sonhos, organizada em um só lugar"
**Data da análise:** 08/09/2026

---

## Resumo

A estrutura da página segue um funil de conversão correto: hero com proposta de valor → como funciona → segmentação por tipo de festa → benefícios → prova social → preço → FAQ → CTA final. A identidade visual (serifada elegante + paleta dourado/creme/preto) combina bem com o público-alvo. Os principais problemas encontrados são um bug visual nos ícones, uso de placeholders genéricos nos elementos de prova social, links administrativos expostos publicamente, e um desequilíbrio de foco no hero que favorece casamentos em detrimento dos outros três segmentos atendidos.

---

## Design

A identidade visual está bem resolvida no conceito: tipografia serifada elegante nos títulos combinada com sans-serif no corpo, paleta dourado/creme/preto que remete a convite de festa premium, cantos arredondados suaves. Isso combina com o público (casamento, debutante) e passa sofisticação sem parecer datado.

**Bug visível — ícones quebrados.** Na seção "Por que escolher a Convite", os cinco ícones estão vazios: aparece apenas o quadrado com borda dourada, sem o ícone dentro (confirmado ao rolar a página). Numa página que vende justamente uma ferramenta "bonita e fácil", ícones quebrados no ar transmitem o oposto — parece inacabado.

**Placeholders nos elementos de prova.** Todos os elementos visuais de prova (o mockup do card "Marina & Thiago" no hero, o "Mockup — Casamento" na seção de segmentação, as fotos dos depoimentos) são placeholders cinza/bege com texto, não imagens reais. O mockup do hero é literalmente o produto que está sendo vendido — é a primeira coisa que a pessoa vê, e hoje ela vê um gradiente vazio em vez de uma página de evento de verdade. Isso reduz o poder de "mostrar, não contar" que uma landing page desse tipo deveria ter.

**Transição de cor abrupta.** A passagem do fundo creme para o rodapé preto é brusca — um tom escuro na mesma família de cor (marrom-carvão, por exemplo) manteria a identidade visual mais coesa que o preto puro.

---

## UX

A estrutura geral da página está correta e não precisa ser reinventada. Os pontos que travam a experiência:

**Falta de navegação no cabeçalho.** O header só tem o logo e "Entrar" — não há como pular direto para "Planos" ou "Como funciona" a partir do topo. Numa página longa como essa (7+ seções), uma navegação âncora simples, ou pelo menos um CTA fixo ao rolar, ajudaria bastante — principalmente em mobile, canal provável de descoberta via WhatsApp.

**Links administrativos expostos no rodapé público.** O rodapé mostra "Painel do cliente" e "Admin" para qualquer visitante. Isso provavelmente é resquício de ambiente de desenvolvimento, mas numa página pública de produção é um problema de segurança e profissionalismo — expõe a existência de uma rota administrativa sem função nenhuma para o usuário final. Recomenda-se remover ou mover para uma área autenticada antes do lançamento.

**Abas de segmentação não totalmente verificadas.** Os seletores de tipo de festa (Casamento / Debutante / Aniversário infantil / Corporativo) são uma ótima ideia de personalização. Só foi possível confirmar o conteúdo da aba "Casamento" nesta análise; vale testar se as outras três realmente trocam a lista de recursos e o mockup — se apenas a primeira aba funcionar, isso vira uma promessa não cumprida.

**Colisão de nomenclatura.** A seção de planos usa bem a âncora "Mais popular" no plano Premium — reforço de decisão correto. Porém o nome do plano "Corporativo" colide com o nome do segmento "Corporativo" nas abas de cima; não é grave, mas pode gerar confusão momentânea sobre se são a mesma coisa.

---

## Marketing

O headline "A festa dos seus sonhos, organizada em um só lugar" com o subtítulo listando recursos concretos (RSVP, presentes, amigo secreto) combina bem o emocional com o funcional. Os CTAs em primeira pessoa ("Criar minha página do evento") são a escolha certa — esse padrão de copy converte mais do que um genérico "Começar agora".

**Desequilíbrio de foco no hero.** A página atende quatro públicos (casamento, debutante, aniversário infantil, corporativo), mas todo o hero — mockup, nome do casal, data — é 100% voltado a casamento. Quem chega buscando organizar uma festa infantil ou um evento corporativo pode, nos primeiros segundos, achar que caiu num site de casamento e não perceber que o produto também serve para eles até rolar a página. Trocar o mockup do hero dinamicamente por segmento, ou pelo menos sinalizar logo no topo que a solução cobre casamentos, debutantes, aniversários e eventos corporativos, reduziria essa fricção de relevância.

**Depoimentos bem escolhidos, mal executados.** Os três depoimentos cobrem exatamente os três segmentos principais (casamento, debutante, corporativo) — um acerto de copywriting que reforça a mensagem "funciona pro seu tipo de festa". O problema é a execução: os avatares são círculos "Foto" genéricos em vez de fotos reais. Depoimento sem rosto real tende a parecer forjado, o que pode ser pior do que não ter depoimento nenhum.

**Prova social B2B não sustentada.** O texto "Sua casa de eventos já recomenda" e o selo "Disponível em parceria com casas de eventos e buffets em todo o Brasil" fazem uma promessa de validação forte, mas não há nenhuma logo de parceiro na página. Uma faixa de logos, mesmo que de poucos parceiros iniciais, multiplicaria a credibilidade dessa alegação.

**Diferencial de preço subaproveitado.** "Preço por evento, sem mensalidade eterna" é uma resposta direta a uma objeção real (medo de assinatura recorrente) e provavelmente o maior gancho de venda contra concorrentes que cobram mensalidade. Hoje esse texto só aparece lá embaixo, na seção de planos — vale subir essa mensagem para perto do hero, como um selo pequeno logo abaixo do CTA principal.

**FAQ bem direcionado.** As perguntas escolhidas (precisa programar? convidados criam conta? pode cancelar? funciona para qualquer festa? pode mudar cor depois?) atacam objeções reais de pré-compra. Poderia se beneficiar de mais uma pergunta cobrindo se convidados pagam algo ou precisam de aplicativo, e se é possível usar domínio próprio no plano Corporativo.

---

## Prioridades de execução

1. **Crítico e barato** — corrigir os ícones quebrados na seção "Por que escolher"; remover os links "Admin" e "Painel do cliente" do rodapé público.
2. **Alto impacto em conversão** — substituir mockups e fotos placeholder por imagens reais (mesmo que de eventos beta); adicionar faixa de logos de parceiros (buffets/casas de eventos).
3. **Ajustes de mensagem** — subir a mensagem "sem mensalidade" para mais perto do topo; resolver o viés de casamento no hero para os outros três segmentos atendidos.
4. **Polimento** — adicionar navegação âncora no cabeçalho; confirmar que as quatro abas de tipo de festa realmente trocam o conteúdo exibido.
