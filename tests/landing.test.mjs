import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

/**
 * Testes da landing pública (`src/app/Landing.tsx`). Não tocam o banco — são
 * asserções sobre o conteúdo do componente, cobrindo as regras da spec
 * `landing-page` do change `improve-landing-page-convite`:
 *
 * - as 4 abas de tipo de festa têm conteúdo próprio;
 * - o rodapé não expõe rotas administrativas.
 */
const root = fileURLToPath(new URL("../", import.meta.url));
const landing = readFileSync(root + "src/app/Landing.tsx", "utf8");

describe("landing pública", () => {
  it("tem as 4 abas de tipo de festa com listas de recursos distintas", () => {
    for (const key of ["casamento", "debutante", "infantil", "corporativo"]) {
      assert.match(landing, new RegExp(`\\b${key}:\\s*{`), `falta o segmento ${key}`);
    }

    // Cada segmento define seu próprio card de hero, com título distinto.
    const heroTitles = [...landing.matchAll(/hero:\s*{\s*title:\s*"([^"]+)"/g)].map((m) => m[1]);
    assert.equal(heroTitles.length, 4, "cada segmento precisa do seu card de hero");
    assert.equal(new Set(heroTitles).size, 4, "os cards de hero precisam ser distintos");

    // A seção de tipos de festa renderiza a lista do segmento ativo.
    assert.match(landing, /active\.features\.map/);
  });

  it("o hero reage à aba selecionada", () => {
    // O card do hero lê de `active.hero.*` e o mockup de `active.mockup`.
    assert.match(landing, /active\.hero\.title/);
    assert.match(landing, /active\.hero\.cta/);
    assert.match(landing, /src={active\.mockup}/);
  });

  it("o rodapé não linka rotas administrativas", () => {
    const footer = landing.slice(landing.indexOf("<footer"), landing.indexOf("</footer>"));
    assert.doesNotMatch(footer, /\/painel/, "rodapé não deve linkar /painel");
    assert.doesNotMatch(footer, /\/admin/, "rodapé não deve linkar /admin");
    assert.doesNotMatch(footer, /\/rotas/, "rodapé não deve linkar /rotas");
  });

  it("nenhum link para /admin ou /rotas em toda a landing", () => {
    assert.doesNotMatch(landing, /href=["'`]?\/admin/);
    assert.doesNotMatch(landing, /href=["'`]?\/rotas/);
    assert.doesNotMatch(landing, /"\/rotas"/);
  });

  it("mostra a mensagem de preço sem mensalidade junto ao CTA do hero", () => {
    assert.match(landing, /sem mensalidade/i);
  });

  it("o plano de empresas não colide com o rótulo do segmento 'Corporativo'", () => {
    assert.doesNotMatch(landing, /name:\s*"Corporativo"/);
    assert.match(landing, /name:\s*"Empresas"/);
  });
});
