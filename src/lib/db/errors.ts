/** Código Postgres de violação de unicidade. */
export const UNIQUE_VIOLATION = "23505";

/** Código Postgres de violação de check constraint. */
export const CHECK_VIOLATION = "23514";

/**
 * Erros da camada de dados que as rotas sabem traduzir em status HTTP.
 *
 * Existe para que uma rota não precise interpretar código de erro do Postgres
 * para decidir entre 404, 409 e 500.
 */
export class DbError extends Error {
  constructor(
    message: string,
    readonly kind: "conflito" | "nao-encontrado" | "invalido" | "desconhecido",
  ) {
    super(message);
    this.name = "DbError";
  }
}

export class SlugConflictError extends DbError {
  constructor(slug: string) {
    super(`O endereço "${slug}" já pertence a outro evento.`, "conflito");
    this.name = "SlugConflictError";
  }
}

/**
 * Códigos que `submit_rsvp`/`submit_open_rsvp` levantam como
 * `raise exception '<código>' using errcode = 'P0001'`. Mapeados por código
 * curto e estável em vez de parsear a mensagem livre do Postgres.
 */
const RSVP_ERROR_MESSAGES: Record<string, string> = {
  convite_invalido: "Este link de convite não é válido.",
  modulo_desabilitado: "O RSVP não está habilitado para este evento.",
  prazo_encerrado: "O prazo para responder este convite já passou.",
  lista_fechada: "Este evento não aceita RSVP de quem não foi convidado.",
};

export class RsvpError extends DbError {
  constructor(readonly code: string) {
    super(RSVP_ERROR_MESSAGES[code] ?? "Não foi possível registrar a resposta.", "invalido");
    this.name = "RsvpError";
  }
}

/** Código Postgres genérico usado pelas exceções de domínio do banco. */
export const DOMAIN_EXCEPTION = "P0001";

export function toRsvpError(error: { code?: string; message: string }): DbError {
  if (error.code === DOMAIN_EXCEPTION && error.message in RSVP_ERROR_MESSAGES) {
    return new RsvpError(error.message);
  }
  return new DbError(error.message, "desconhecido");
}

/**
 * Códigos que `submit_menu_vote` levanta como
 * `raise exception '<código>' using errcode = 'P0001'`.
 */
const MENU_VOTE_ERROR_MESSAGES: Record<string, string> = {
  convite_invalido: "Este link de convite não é válido.",
  enquete_invalida: "Esta enquete não existe ou não pertence a este evento.",
  modulo_desabilitado: "A votação de cardápio não está habilitada para este evento.",
  prazo_encerrado: "O prazo para votar nesta enquete já passou.",
  escolha_vazia: "Escolha ao menos uma opção.",
  excesso_de_escolhas: "Você escolheu mais opções do que esta enquete permite.",
  opcao_duplicada: "Cada opção só pode ser escolhida uma vez.",
  opcao_invalida: "Uma das opções escolhidas não pertence a esta enquete.",
};

export class MenuVoteError extends DbError {
  constructor(readonly code: string) {
    super(
      MENU_VOTE_ERROR_MESSAGES[code] ?? "Não foi possível registrar o voto.",
      "invalido",
    );
    this.name = "MenuVoteError";
  }
}

export function toMenuVoteError(error: { code?: string; message: string }): DbError {
  if (error.code === DOMAIN_EXCEPTION && error.message in MENU_VOTE_ERROR_MESSAGES) {
    return new MenuVoteError(error.message);
  }
  return new DbError(error.message, "desconhecido");
}

/**
 * Códigos que `start_gift_checkout`/`attach_checkout_session` levantam como
 * `raise exception '<código>' using errcode = 'P0001'`. `valor_excede_restante`
 * carrega o valor máximo aceito no próprio código (`valor_excede_restante:12345`),
 * por isso é tratado à parte em vez de entrar no mapa fixo.
 */
const GIFT_CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  comprador_invalido: "Informe seu nome para continuar.",
  evento_indisponivel: "Este evento não está disponível.",
  modulo_desabilitado: "A lista de presentes não está habilitada para este evento.",
  presente_nao_encontrado: "Presente não encontrado.",
  presente_indisponivel: "Este presente já foi escolhido por outra pessoa.",
  presente_reservado: "Este presente já está reservado por outra pessoa.",
  valor_invalido: "Informe um valor de contribuição válido.",
  pagamento_invalido: "Não foi possível continuar este pagamento.",
};

export class GiftCheckoutError extends DbError {
  constructor(
    readonly code: string,
    /** Presente em centavos só quando `code` é `valor_excede_restante`. */
    readonly maxAmountCents?: number,
  ) {
    super(
      GIFT_CHECKOUT_ERROR_MESSAGES[code] ??
        (code === "valor_excede_restante"
          ? `O valor máximo aceito para esta cota é ${((maxAmountCents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`
          : "Não foi possível continuar."),
      "invalido",
    );
    this.name = "GiftCheckoutError";
  }
}

export function toGiftCheckoutError(error: { code?: string; message: string }): DbError {
  if (error.code !== DOMAIN_EXCEPTION) return new DbError(error.message, "desconhecido");

  const [rawCode, rawAmount] = error.message.split(":");
  if (rawCode === "valor_excede_restante") {
    return new GiftCheckoutError(rawCode, Number(rawAmount) || 0);
  }
  if (rawCode in GIFT_CHECKOUT_ERROR_MESSAGES) {
    return new GiftCheckoutError(rawCode);
  }
  return new DbError(error.message, "desconhecido");
}
