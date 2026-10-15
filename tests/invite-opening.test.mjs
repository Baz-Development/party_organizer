import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  confettiFor,
  coverLine,
  parseAge,
  pickOpening,
  sanitizeGuestName,
} from "../src/components/invite-opening/pick.ts";

/** Regras puras da abertura do convite (`abertura-do-convite.md`). Não tocam banco nem DOM. */
describe("abertura do convite", () => {
  it("categorias elegantes usam o envelope; aniversário é lúdico e estável por id", () => {
    for (const kind of ["casamento", "debutante", "corporativo", "formatura", "outros"]) {
      assert.equal(pickOpening(kind, "x"), "envelope");
    }
    const a = pickOpening("aniversario", "id-1");
    assert.notEqual(a, "envelope");
    assert.equal(pickOpening("aniversario", "id-1"), a);
  });

  it("o confete depende da categoria", () => {
    assert.equal(confettiFor("aniversario"), "festivo");
    assert.equal(confettiFor("debutante"), "rose-dourado");
    assert.equal(confettiFor("casamento"), "petalas");
    assert.equal(confettiFor("corporativo"), "discreto");
  });

  it("lê a idade do título para as velas", () => {
    assert.equal(parseAge("Bento faz 5 anos"), 5);
    assert.equal(parseAge("Casamento Ana & Léo"), null);
  });

  it("nome opcional: sanitiza, limita e cai no texto genérico", () => {
    assert.equal(coverLine(null), "Você foi convidado(a)");
    assert.equal(coverLine("Mariana"), "Mariana, você foi convidado(a)");
    assert.equal(sanitizeGuestName(undefined), null);
    assert.equal(sanitizeGuestName("   "), null);
    assert.equal(sanitizeGuestName("<script>x</script>"), "scriptx/script");
    assert.equal(sanitizeGuestName("a".repeat(100))?.length, 40);
    assert.equal(sanitizeGuestName(["Ana", "Bia"]), "Ana");
  });
});
