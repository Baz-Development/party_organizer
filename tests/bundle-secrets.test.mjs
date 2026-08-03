import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { glob } from "node:fs/promises";
import { describe, it } from "node:test";
import { loadEnvFile } from "../scripts/db/_env.mjs";

loadEnvFile();

/**
 * A garantia inteira da RLS depende de a chave `service-role` nunca sair do
 * servidor. `import "server-only"` deveria impedir, mas um erro de
 * configuração pode desligá-lo em silêncio — então conferimos o artefato que
 * realmente vai para o navegador.
 *
 * Depende de um `npm run build` anterior. `npm run verify` roda na ordem certa.
 */
describe("bundle do cliente", () => {
  it("não contém a chave service-role", async () => {
    const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.ok(chave, "defina SUPABASE_SERVICE_ROLE_KEY para rodar esta verificação");

    const arquivos = [];
    for await (const arquivo of glob(".next/static/**/*.js")) {
      arquivos.push(arquivo);
    }

    assert.ok(
      arquivos.length > 0,
      "nenhum arquivo em .next/static — rode `npm run build` antes",
    );

    const vazando = arquivos.filter((arquivo) =>
      readFileSync(arquivo, "utf8").includes(chave),
    );

    assert.deepEqual(
      vazando,
      [],
      `a chave service-role apareceu em: ${vazando.join(", ")}`,
    );
  });

  it("não contém a string de conexão do banco", async () => {
    const dbUrl = process.env.SUPABASE_DB_URL;
    assert.ok(dbUrl, "defina SUPABASE_DB_URL");

    // A senha isolada: procurar a URL inteira deixaria passar um vazamento
    // parcial, e é a credencial que importa.
    const senha = new URL(dbUrl).password;
    assert.ok(senha, "a string de conexão de teste deveria ter senha");

    const vazando = [];
    for await (const arquivo of glob(".next/static/**/*.js")) {
      const conteudo = readFileSync(arquivo, "utf8");
      if (conteudo.includes(dbUrl) || conteudo.includes(`postgresql://postgres:${senha}`)) {
        vazando.push(arquivo);
      }
    }

    assert.deepEqual(vazando, [], `conexão do banco apareceu em: ${vazando.join(", ")}`);
  });
});
