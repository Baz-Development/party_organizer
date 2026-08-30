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
// Versões recentes do CLI ainda anexam uma linha JSON de resumo
// (`{"diff":"", ...}`) — quando `diff` vem vazio, o schema está em dia.
const jsonSummary = result.stdout
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.startsWith("{") && line.endsWith("}"))
  .map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  })
  .find((parsed) => parsed && typeof parsed.diff === "string");

const diff = result.stdout
  .split("\n")
  .filter(
    (line) =>
      !line.startsWith("Connecting") &&
      !line.startsWith("Diffing") &&
      !(line.trim().startsWith("{") && line.trim().endsWith("}")),
  )
  .join("\n")
  .trim();

const inSync =
  (jsonSummary ? jsonSummary.diff.trim() === "" : false) ||
  diff === "" ||
  /No schema changes found/i.test(diff);

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
