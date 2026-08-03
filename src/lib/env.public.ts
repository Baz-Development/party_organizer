import { z } from "zod";

/**
 * Variáveis expostas ao navegador.
 *
 * Este módulo é importável de Client Components. Nenhum segredo entra aqui —
 * as variáveis de servidor vivem em `src/lib/env.ts`, que é `server-only`.
 *
 * Os acessos a `process.env` precisam ser literais: o Next.js substitui
 * `process.env.NEXT_PUBLIC_X` no bundle em tempo de build e não enxerga
 * acessos dinâmicos como `process.env[nome]`.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url("precisa ser uma URL absoluta"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "não pode ser vazia"),
  NEXT_PUBLIC_SITE_URL: z
    .url("precisa ser uma URL absoluta")
    .refine((v) => !v.endsWith("/"), "não pode terminar com barra"),
});

export const publicEnv = parsePublicEnv();

function parsePublicEnv(): z.infer<typeof schema> {
  const result = schema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!result.success) {
    throw new Error(formatEnvIssues("públicas", result.error.issues));
  }
  return result.data;
}

/** Mensagem que nomeia cada variável problemática — sem imprimir o valor. */
export function formatEnvIssues(
  scope: string,
  issues: readonly { path: PropertyKey[]; message: string; code: string }[],
): string {
  const lines = issues.map((issue) => {
    const name = String(issue.path[0] ?? "(desconhecida)");
    const reason =
      issue.code === "invalid_type" ? "não está definida" : issue.message;
    return `  - ${name}: ${reason}`;
  });
  return [
    `Configuração de ambiente inválida (variáveis ${scope}):`,
    ...lines,
    "Copie .env.example para .env.local e preencha os valores do seu ambiente.",
  ].join("\n");
}
