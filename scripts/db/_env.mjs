import { existsSync, readFileSync } from "node:fs";

/**
 * Lê um arquivo .env para dentro de `process.env`, sem sobrescrever o que já
 * veio do ambiente — em CI as variáveis chegam pelo provedor, não por arquivo.
 *
 * Os scripts de banco rodam fora do Next.js, que é quem normalmente carrega o
 * `.env.local`; por isso a leitura acontece aqui.
 */
export function loadEnvFile(path = ".env.local") {
  if (!existsSync(path)) return;

  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;

    process.env[key] = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

/** Lê uma variável obrigatória, falhando com uma mensagem que a nomeia. */
export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Variável ${name} não está definida.`,
      "\nCopie .env.example para .env.local e preencha os valores do ambiente.",
    );
    process.exit(1);
  }
  return value;
}
