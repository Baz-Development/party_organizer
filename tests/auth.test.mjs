import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { admin } from "./harness.mjs";
import { loadEnvFile, requireEnv } from "../scripts/db/_env.mjs";

loadEnvFile();

const SITE = requireEnv("NEXT_PUBLIC_SITE_URL");

/**
 * Fluxo de sessão de ponta a ponta, contra a aplicação rodando.
 *
 * Sobe um link mágico de verdade pela API administrativa, consome o callback
 * e usa os cookies devolvidos para bater nas rotas protegidas — que é
 * exatamente o caminho que uma pessoa percorre.
 *
 * Pula se o servidor não estiver de pé: `npm test` não deve exigir `npm run
 * dev`. Rode os dois juntos para exercitar esta parte.
 */
describe("sessão de ponta a ponta", () => {
  let servidorNoAr = false;

  before(async () => {
    try {
      const res = await fetch(`${SITE}/entrar`, { redirect: "manual" });
      servidorNoAr = res.status === 200;
    } catch {
      servidorNoAr = false;
    }
  });

  it("link mágico cria sessão e libera as rotas do papel", async (t) => {
    if (!servidorNoAr) {
      t.skip(`aplicação não respondeu em ${SITE} — rode \`npm run dev\``);
      return;
    }

    const email = `e2e-${Date.now()}@teste.local`;
    const { data: criado } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    try {
      await admin.from("profiles").update({ role: "admin" }).eq("id", criado.user.id);

      const { data: link, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      assert.ok(!error, `falha ao gerar link: ${error?.message}`);

      const callback = new URL(`${SITE}/api/auth/callback`);
      callback.searchParams.set("token_hash", link.properties.hashed_token);
      callback.searchParams.set("type", "magiclink");
      callback.searchParams.set("next", "/admin");

      const res = await fetch(callback, { redirect: "manual" });

      assert.equal(res.status, 307, "o callback deveria redirecionar");
      assert.equal(
        res.headers.get("location"),
        `${SITE}/admin`,
        "deveria levar ao destino pedido em `next`",
      );

      const cookies = res.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
      assert.ok(cookies.includes("sb-"), "a sessão deveria vir nos cookies");

      // Com sessão de admin, a área administrativa abre.
      const painelAdmin = await fetch(`${SITE}/admin`, {
        headers: { cookie: cookies },
        redirect: "manual",
      });
      assert.equal(painelAdmin.status, 200, "admin deveria acessar /admin");

      // O mesmo link não vale duas vezes.
      const repetido = await fetch(callback, { redirect: "manual" });
      assert.equal(
        repetido.headers.get("location"),
        `${SITE}/entrar?erro=link-invalido`,
        "link já consumido deveria voltar para a tela de entrada",
      );
    } finally {
      await admin.auth.admin.deleteUser(criado.user.id);
    }
  });

  it("`next` para fora do site é descartado", async (t) => {
    if (!servidorNoAr) {
      t.skip(`aplicação não respondeu em ${SITE}`);
      return;
    }

    // Sem token válido o destino é a tela de entrada, mas o que importa aqui é
    // que o host estranho não aparece em lugar nenhum do redirect.
    const res = await fetch(
      `${SITE}/api/auth/callback?code=invalido&next=https://site-falso.example/roubo`,
      { redirect: "manual" },
    );

    const destino = res.headers.get("location") ?? "";
    assert.ok(
      destino.startsWith(SITE),
      `redirect saiu do site: ${destino}`,
    );
    assert.ok(!destino.includes("site-falso"), "open redirect");
  });
});
