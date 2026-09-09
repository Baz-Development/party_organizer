/**
 * Casas de eventos e buffets parceiros exibidos na faixa de prova social da
 * landing. Conteúdo de marketing, não faz parte do seed do banco.
 *
 * Enquanto não houver material real, a lista fica vazia — a landing então
 * omite a faixa de logos e a frase "Disponível em parceria com casas de
 * eventos e buffets em todo o Brasil" (ver `src/app/Landing.tsx`).
 *
 * Para adicionar: coloque o PNG sem fundo em `public/parceiros/` e cite o
 * caminho em `logo`.
 */
export interface Partner {
  name: string;
  /** Caminho a partir de `/public`, ex.: `/parceiros/villa-nova.png` */
  logo: string;
}

export const PARTNERS: Partner[] = [];
