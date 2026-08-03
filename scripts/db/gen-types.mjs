#!/usr/bin/env node
/**
 * Gera src/lib/database.types.ts a partir do schema do banco.
 *
 * Aponta para `SUPABASE_DB_URL` — use o `.env.local` para o banco local e as
 * variáveis do ambiente para gerar a partir de staging.
 *
 * Um wrapper em Node em vez de `supabase gen types > arquivo` porque o
 * redirecionamento do shell no Windows não grava UTF-8 de forma confiável.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runSupabase } from "./_cli.mjs";
import { loadEnvFile, requireEnv } from "./_env.mjs";

loadEnvFile();

const OUTPUT = resolve("src/lib/database.types.ts");
const dbUrl = requireEnv("SUPABASE_DB_URL");

const result = runSupabase([
  "gen",
  "types",
  "typescript",
  "--db-url",
  dbUrl,
  "--schema",
  "public",
]);

if (result.status !== 0 || !result.stdout.includes("export type Database")) {
  process.stderr.write(result.stderr || "");
  console.error(
    "\nFalha ao gerar os tipos. O ambiente local está de pé? Rode `npm run db:start`.",
  );
  process.exit(result.status || 1);
}

const header = [
  "// Gerado por `npm run db:types` a partir do schema do banco.",
  "// Não edite à mão: qualquer alteração é sobrescrita na próxima geração.",
  "",
].join("\n");

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, header + result.stdout, "utf8");
console.log(`Tipos gravados em ${OUTPUT}`);
