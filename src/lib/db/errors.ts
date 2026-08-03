/** Código Postgres de violação de unicidade. */
export const UNIQUE_VIOLATION = "23505";

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
