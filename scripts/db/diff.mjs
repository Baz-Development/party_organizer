#!/usr/bin/env node
/**
 * Compara o schema de um ambiente com o estado esperado pelas migrations.
 *
 * Sai com código 1 quando há divergência, para que o passo de deploy no
 * pipeline seja interrompido antes de subir código sobre um banco inesperado.
 *
 * Uso:
 *   npm run db:diff              # banco local
 *   npm run db:diff -- --linked  # projeto remoto vinculado (staging/produção)
 */
import { runSupabase } from "./_cli.mjs";

const target = process.argv.includes("--linked") ? "--linked" : "--local";

const result = runSupabase(["db", "diff", target, "--schema", "public"]);

if (result.status !== 0) {
  process.stderr.write(result.stderr || "");
  console.error("\nNão foi possível comparar o schema.");
  process.exit(result.status ?? 1);
}

// O CLI imprime o SQL necessário para alinhar o banco às migrations.
// Saída vazia (fora as mensagens informativas) significa schema em dia.
const diff = result.stdout
  .split("\n")
  .filter((line) => !line.startsWith("Connecting") && !line.startsWith("Diffing"))
  .join("\n")
  .trim();

const inSync = diff === "" || /No schema changes found/i.test(diff);

if (inSync) {
  console.log(`Schema em dia com as migrations (${target.replace("--", "")}).`);
  process.exit(0);
}

console.error("Divergência de schema detectada — deploy interrompido.\n");
console.error(diff);
console.error(
  "\nO schema do ambiente difere das migrations versionadas. Alterações feitas",
  "\npelo painel do Supabase não são válidas: traga a mudança para uma migration",
  "\ncom `supabase db diff -f <nome>` e aplique pelo pipeline.",
);
process.exit(1);
