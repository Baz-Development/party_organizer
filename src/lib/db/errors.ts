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
