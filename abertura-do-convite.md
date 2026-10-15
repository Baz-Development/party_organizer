# Abertura do Convite: Experiência de Entrada do Convidado

> Planejamento da animação que o convidado vê **antes** da página do convite
> (ex.: `/{id}/aniversario-do-bento`). Objetivo: uma experiência simples, rápida,
> elegante e memorável, que funcione para quem tem pouco tempo.

---

## 1. Visão geral

Quando o cliente recebe acesso à plataforma e envia o convite, o convidado não cai direto na página. Ele passa por uma **abertura teatral curta**:

1. **Capa** com o objeto da abertura (envelope, balão, bolo etc.) e uma instrução mínima.
2. **Um gesto** do convidado (tocar, segurar ou arrastar).
3. **Revelação** do convite, com o objeto virando o hero da página.
4. **Confete** de parabéns pelo convite, que encerra o trecho teatral.
5. **Página do convite** normal (cronograma, local, presentes, galeria, RSVP).

O tipo de abertura é escolhido conforme a **categoria da festa**. Todas seguem o mesmo esqueleto e a mesma duração, e só mudam a ilustração e o gesto.

---

## 2. Princípios

| # | Princípio                                    | Na prática                                                                                                                                         |
| - | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | **Um gesto só**                        | Tocar, segurar ou arrastar uma vez. O convidado nunca fica em dúvida sobre o que fazer.                                                            |
| 2 | **De 3 a 5 segundos no total**          | Contando da interação até a página. Sempre com um botão **"Pular"** discreto.                                                            |
| 3 | **Sem repetição**                     | Quem volta ao link (para ver o endereço, por exemplo) cai direto na página, sem refazer a abertura.                                               |
| 4 | **Continuidade**                        | O objeto da abertura (envelope, cartão) **vira o hero** da página por transição de elemento compartilhado. Não há corte seco.           |
| 5 | **A animação esconde o carregamento** | Enquanto a abertura roda, o sistema pré-carrega a imagem do hero e os dados da página.                                                            |
| 6 | **Fim com celebração**                | Ao terminar a animação, um confete de parabéns pelo convite fecha o trecho teatral. O estilo do confete depende da categoria da festa.           |
| 7 | **Nome do convidado é opcional**       | Para facilitar o envio em massa, o convite **não depende de nome**. Se vier por query param, personaliza. Se não vier, usa texto genérico. |

---

## 3. Linha do tempo (alvo: 3 a 5 s)

```
0,0 s   Capa carregada (objeto fechado + instrução curta)      ← pré-carregamento em paralelo
        [convidado faz o gesto]
+0,0 s  Gesto reconhecido, feedback imediato
+1,5 s  Clímax da abertura (selo racha, velas apagam, balão estoura...)
+2,5 s  Transição compartilhada: objeto → hero
+3,0 s  Confete de parabéns (~1,5 s)
+4,0 s  Página liberada para rolagem
```

- O tempo de **espera pelo gesto não conta** nos 3 a 5 s, só a animação em si.
- Se o hero ainda não carregou quando a revelação começa, a animação segura o último frame por alguns instantes (nunca mostra imagem pela metade).
- **"Pular"** leva direto ao estado final, sem confete e com um fade curto.

---

4. Personalização por nome (opcional)

O convite principal **não tem nome**. Para quem quiser personalizar, o nome vem por query param:

```
/{id}/aniversario-do-bento?nome=Mariana
```

| Situação     | Texto da capa                            |
| -------------- | ---------------------------------------- |
| Com `?nome=` | "**Mariana**, você foi convidada" |
| Sem `?nome=` | "Você foi convidado(a)"                 |

Regras:

- Nunca bloquear nem quebrar a experiência por falta de nome.
- Sanitizar e limitar o tamanho do valor (ex.: 40 caracteres) para evitar XSS e quebra de layout.
- Na abertura **Nomes escritos à mão**, sem nome o texto manuscrito passa a ser o **nome do evento** ou do anfitrião (ex.: "Bento faz 5 anos"). Assim a abertura funciona igual.
- O link de prévia do WhatsApp (`og:image`) é **sempre genérico**, já que não depende do nome.

---

## 5. Aberturas por categoria

### 5.1 Elegantes (casamento, 15 anos, corporativo)

#### Envelope com selo de cera

- **Capa:** envelope fechado sobre fundo de papel, selo de cera no centro, instrução "Segure o selo".
- **Gesto:** **segurar** o selo (~0,8 s). Um anel de progresso se completa ao redor dele.
- **Animação:** o selo racha, a aba abre, o cartão sobe e cresce até virar o hero.
- **Transição compartilhada:** o cartão é o próprio hero (mesma imagem e título), sem troca.
- **Por que funciona:** é o clássico e é imediato de entender.

#### Nomes escritos à mão

- **Capa:** fundo claro com um convite sutil: "Toque para começar".
- **Gesto:** **tocar** em qualquer ponto.
- **Animação:** uma mancha de aquarela se espalha **a partir do ponto do toque** enquanto os nomes se desenham em caligrafia (animação do traço em SVG, `stroke-dashoffset`). Os nomes ficam e viram o título do hero.
- **Observação:** precisa de uma fonte caligráfica convertida em *paths* SVG para animar o traço.

#### Cartão pop-up em 3D

- **Capa:** cartão fechado, com leve inclinação.
- **Gesto:** **arrastar** para cima ou **tocar** para abrir.
- **Animação:** camadas de papel se desdobram em profundidade. Após abrir, há **parallax pelo giroscópio** quando o celular é inclinado.
- **Detalhes técnicos:**
  - No iOS, o giroscópio exige permissão (`DeviceOrientationEvent.requestPermission()`), que deve ser pedida **dentro do gesto de toque**.
  - Sem permissão ou sem sensor, usar parallax por **posição do toque/mouse** ou ficar estático.

### 5.2 Lúdicas (infantil, como o aniversário do Bento)

#### "Sopre as velinhas"

- **Capa:** bolo com **5 velas acesas, uma para cada ano** (o número vem dos dados do evento). Instrução: "Sopre as velinhas".
- **Gesto, de duas formas:**
  1. **Soprar no microfone** (opcional). Só ativa se o convidado permitir.
  2. **Deslizar o dedo** sobre as velas. É o caminho padrão e **não depende de permissão**.
- **Animação:** as chamas se apagam com atraso escalonado, sai fumacinha e explode o confete. O bolo desliza e vira o hero.
- **Por que funciona:** os pais mostram para a criança, o que vira conversa e memória.
- **Cuidados:** nunca exigir o microfone, e o pedido de permissão só aparece se o convidado escolher soprar.

#### Estourar o balão

- **Capa:** balão grande e flutuando levemente.
- **Gesto:** **um toque** estoura.
- **Animação:** o balão vira confete e o convite **cai flutuando**, pousando como hero.

#### Caixa de presente

- **Capa:** caixa fechada com laço.
- **Gesto:** **puxar o laço** (arrastar) ou tocar.
- **Animação:** o laço se desfaz, a tampa salta e o conteúdo sobe, virando o hero.

#### Raspadinha

- **Capa:** cartão prateado com "Raspe para descobrir a data".
- **Gesto:** **arrastar o dedo** sobre a área.
- **Animação:** ao raspar ~50 a 60%, o restante se revela sozinho (não obrigar a raspar tudo). A data aparece em destaque, e a cartela vira o hero.
- **Por que funciona:** prende a atenção exatamente na informação mais importante.
- **Técnica:** `<canvas>` com máscara, medindo a porcentagem raspada.

---

## 6. Confete de encerramento por categoria

Ao fim da abertura, o confete dá o "parabéns pelo convite". O **estilo muda com a categoria**:

| Categoria   | Confete sugerido                                                  |
| ----------- | ----------------------------------------------------------------- |
| Infantil    | Colorido, farto, em rajadas.                                      |
| 15 anos     | Rosé e dourado, volume médio.                                   |
| Casamento   | Dourado e branco, delicado, parecido com pétalas. Poucas peças. |
| Corporativo | Discreto e curto, ou desligado.                                   |

Regras:

- Duração curta (~1,5 s) e **sem bloquear o toque**. A página já pode ser usada durante o confete.
- Desativado quando o movimento reduzido está ativo (ver seção 8).

---

## 7. Continuidade e carregamento

### Transição de elemento compartilhado

- O objeto da abertura e o hero compartilham a **mesma imagem/elemento**. Ele se transforma de posição e escala em vez de ser trocado.
- Implementação sugerida: **View Transitions API**, com fallback para uma animação FLIP quando o navegador não suportar.

### Pré-carregamento escondido pela animação

Enquanto a capa e a animação rodam, o sistema:

- Pré-carrega a **imagem do hero** (já em tamanho responsivo).
- Busca os **dados do evento** (cronograma, local, presentes) e as fontes.
- Só libera a revelação quando o hero estiver pronto, e segura o último frame se necessário.

### Lembrar quem já viu

- Guardar, por convite, que a abertura já foi exibida (ex.: `localStorage` com chave por `id` do convite, **sempre com try/catch**).
- Quem já viu cai direto na página.
- O armazenamento pode falhar (aba anônima, dados bloqueados). Nesse caso, a abertura aparece de novo, o que é aceitável.

---

## 8. Movimento reduzido (acessibilidade)

Se o dispositivo estiver com `prefers-reduced-motion: reduce`:

- **Todas as aberturas** são substituídas por um **fade simples** (~300 ms) para a página.
- Sem confete, sem parallax, sem animação de traço.
- O gesto deixa de ser necessário, e o convidado entra direto.

Complementos:

- O botão "Pular" tem contraste suficiente e é acessível por teclado.
- Instruções em texto real (leitor de tela), não só dentro da ilustração.
- Todos os gestos têm alternativa de **toque simples** quando possível.

---

## 9. A experiência começa no WhatsApp (`og:image`)

A decisão de abrir o link é tomada na **prévia** da mensagem. Por isso:

- `og:image` = **imagem do objeto fechado** da abertura escolhida, com "Você foi convidado(a)".
  - Envelope com selo para casamento, balão ou bolo para festas infantis etc.
- `og:title` = nome do evento (ex.: "Bento faz 5 anos").
- `og:description` = frase curta com data e local.
- Imagem em **1200×630**, com o objeto centralizado (o WhatsApp corta nas bordas).
- A prévia é **genérica**, sem nome do convidado, já que o link principal não tem nome.

---

## 10. Resumo: o que cada abertura entrega

| Abertura                  | Categoria | Gesto              | Alternativa / fallback                        |
| ------------------------- | --------- | ------------------ | --------------------------------------------- |
| Envelope com selo de cera | Elegante  | Segurar            | Toque simples                                 |
| Nomes escritos à mão    | Elegante  | Tocar              | n/a                                           |
| Cartão pop-up em 3D      | Elegante  | Arrastar/tocar     | Parallax por toque se não houver giroscópio |
| Sopre as velinhas         | Infantil  | Soprar ou deslizar | Deslizar é o padrão, sem permissão         |
| Estourar o balão         | Infantil  | Tocar              | n/a                                           |
| Caixa de presente         | Infantil  | Puxar o laço      | Toque simples                                 |
| Raspadinha                | Infantil  | Arrastar           | Revela sozinho ao passar de ~50%              |

---

## 11. Critérios de aceite

- [ ] Do gesto à página liberada em **no máximo 5 s**.
- [ ] **Um único gesto** em todas as aberturas, com instrução curta e clara.
- [ ] Botão **"Pular"** sempre visível e discreto.
- [ ] Quem retorna ao link **não vê** a abertura de novo.
- [ ] Transição **sem corte seco**: o objeto vira o hero.
- [ ] Hero e dados **já carregados** quando a revelação termina.
- [ ] Confete conforme a **categoria**, e sem bloquear a interação.
- [ ] Funciona **sem nome**, e com `?nome=` personaliza de forma segura.
- [ ] Com **movimento reduzido**, só um fade simples.
- [ ] Sem microfone, giroscópio ou armazenamento, a experiência continua funcionando.
- [ ] Prévia do WhatsApp com `og:image` do objeto fechado.

---

## 12. Sugestão de implementação (a validar)

- **Animações ilustradas e interativas** (velas, balão, caixa): Rive ou Lottie.
- **Efeitos de papel e transições**: Motion (Framer Motion) ou GSAP.
- **Confete**: `canvas-confetti`, com paletas por categoria.
- **Transição abertura → hero**: View Transitions API, com fallback FLIP.
- **Estrutura**: cada abertura é um módulo com a mesma interface (`capa`, `gesto`, `revelação`, `onFinish`). Assim novos tipos entram sem mexer na página do convite.
