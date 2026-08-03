#!/usr/bin/env node
/**
 * Regenera `supabase/seed.sql` a partir dos mocks e carrega no banco apontado
 * por `SUPABASE_DB_URL`.
 *
 * Recusa rodar em produção: o seed apaga e reinsere os registros de exemplo, e
 * um `APP_ENV=production` por engano significaria destruir dados reais.
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import { loadEnvFile, requireEnv } from "./_env.mjs";
import { generateSeed } from "./generate-seed.mjs";

loadEnvFile();

const appEnv = process.env.APP_ENV ?? "local";

if (appEnv === "production") {
  console.error(
    "Recusado: o seed é de desenvolvimento e não roda com APP_ENV=production.",
    "\nEle apaga e reinsere os registros de exemplo — em produção isso seria",
    "\nperda de dados reais.",
  );
  process.exit(1);
}

const dbUrl = requireEnv("SUPABASE_DB_URL");

const { output, events, people } = await generateSeed();
console.log(`Seed gerado em ${output} (${events} eventos, ${people} pessoas).`);

// `supabase db query` manda o arquivo como prepared statement, que aceita um
// comando só. O seed é multi-comando e transacional, então falamos com o
// Postgres direto — o que também permite semear staging, não só o local.
const client = new pg.Client({ connectionString: dbUrl });

try {
  await client.connect();
  await client.query(readFileSync(output, "utf8"));
  console.log(`Seed carregado (APP_ENV=${appEnv}).`);
} catch (error) {
  console.error("\nFalha ao carregar o seed no banco:");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
