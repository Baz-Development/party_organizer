/**
 * Configuração de exibição do amigo secreto (valor sugerido, datas de
 * sorteio e troca). Fora do escopo de `add-secret-santa-backend` — o
 * proposal não cria tabela para isso — permanece fixo até um change futuro
 * decidir torná-lo configurável por evento.
 */
export const SECRET_SANTA_CONFIG = {
  budget: "R$ 80",
  drawDate: "2026-11-20",
  exchangeDate: "2026-12-12",
  rules:
    "Cada participante tira um nome só depois do sorteio. O presente deve respeitar o valor combinado e será trocado durante a festa.",
};
