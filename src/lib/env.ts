import "server-only";

import { z } from "zod";
import { formatEnvIssues } from "./env.public";

/**
 * Variáveis que só existem no servidor.
 *
 * `import "server-only"` transforma qualquer import acidental a partir de um
 * Client Component em erro de build — é o que impede a chave `service-role`
 * de vazar para o bundle do navegador.
 */
const schema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "não pode ser vazia"),
  SUPABASE_DB_URL: z
    .string()
    .min(1, "não pode ser vazia")
    .refine(
      (v) => v.startsWith("postgres://") || v.startsWith("postgresql://"),
      "precisa ser uma URL postgres://",
    ),
  APP_ENV: z.enum(["local", "staging", "production"]),
});

export const serverEnv = parseServerEnv();

export const isProduction = serverEnv.APP_ENV === "production";

function parseServerEnv(): z.infer<typeof schema> {
  const result = schema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
    APP_ENV: process.env.APP_ENV,
  });

  if (!result.success) {
    throw new Error(formatEnvIssues("de servidor", result.error.issues));
  }
  return result.data;
}
