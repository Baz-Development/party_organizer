import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * Executa o Supabase CLI.
 *
 * Chamamos o entrypoint do pacote com o próprio Node em vez de passar por
 * `npx`: no Windows, `npx` é um `.cmd`, que o `spawn` do Node só executa com
 * `shell: true` — e aí os argumentos vão concatenados, sem escape.
 */
export function runSupabase(args, options = {}) {
  const cli = require.resolve("supabase/dist/supabase.js");
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    ...options,
  });
}
