import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { anonimo, montarCenario } from "./harness.mjs";

/**
 * Testes de política contra o banco local.
 *
 * Uma RLS mal escrita vaza dados entre organizações — é o risco mais grave
 * desta fundação, e não é o tipo de coisa que aparece em revisão de código.
 * Estes testes falam com o banco como cada papel real fala.
 *
 * Pré-requisito: `npm run db:start`.
 */
describe("RLS", () => {
  let c;

  before(async () => {
    c = await montarCenario();
  });

  after(async () => {
    await c.limpar();
  });

  describe("visibilidade do evento", () => {
    it("evento publicado é visível a quem não tem conta", async () => {
      const { data } = await anonimo
        .from("events")
        .select("id")
        .eq("id", c.eventos.aPublicado)
        .maybeSingle();

      assert.ok(data, "o convidado deveria enxergar um evento publicado");
    });

    it("evento em rascunho não é visível a quem não tem conta", async () => {
      const { data } = await anonimo
        .from("events")
        .select("id")
        .eq("id", c.eventos.aRascunho)
        .maybeSingle();

      assert.equal(data, null, "rascunho não pode vazar para o público");
    });

    it("quem administra enxerga o próprio rascunho", async () => {
      const { data } = await c.membroA.client
        .from("events")
        .select("id")
        .eq("id", c.eventos.aRascunho)
        .maybeSingle();

      assert.ok(data, "o membro da organização dona deveria ver o rascunho");
    });

    it("cronograma de rascunho não vaza junto", async () => {
      const { data } = await anonimo
        .from("schedule_items")
        .select("id")
        .eq("event_id", c.eventos.aRascunho);

      assert.deepEqual(data, []);
    });
  });

  describe("isolamento entre organizações", () => {
    it("membro de A não lê rascunho de B", async () => {
      const { data } = await c.membroA.client
        .from("events")
        .select("id, title, welcome")
        .eq("id", c.eventos.bRascunho)
        .maybeSingle();

      assert.equal(data, null, "nenhum campo do evento de B pode ser revelado");
    });

    it("membro de A não lê a organização B", async () => {
      const { data } = await c.membroA.client
        .from("organizations")
        .select("id")
        .eq("id", c.orgB)
        .maybeSingle();

      assert.equal(data, null);
    });

    it("membro de A não lê os membros de B", async () => {
      const { data } = await c.membroA.client
        .from("organization_members")
        .select("profile_id")
        .eq("organization_id", c.orgB);

      assert.deepEqual(data, []);
    });

    it("listagem por organização de B, feita por A, não devolve nada gerenciável", async () => {
      const { data } = await c.membroA.client
        .from("events")
        .select("id, status")
        .eq("organization_id", c.orgB);

      // Pedir explicitamente a organização alheia não abre exceção nenhuma.
      assert.deepEqual(
        (data ?? []).filter((e) => e.status !== "publicado"),
        [],
      );
    });

    it("membro de A não altera evento de B", async () => {
      const { data } = await c.membroA.client
        .from("events")
        .update({ title: "invadido" })
        .eq("id", c.eventos.bRascunho)
        .select("id");

      assert.deepEqual(data, [], "o update não pode atingir nenhuma linha");

      // E o dado continua intacto quando quem tem direito olha.
      const { data: original } = await c.membroB.client
        .from("events")
        .select("title")
        .eq("id", c.eventos.bRascunho)
        .single();

      assert.notEqual(original.title, "invadido");
    });

    it("membro de A não apaga evento de B", async () => {
      const { data } = await c.membroA.client
        .from("events")
        .delete()
        .eq("id", c.eventos.bRascunho)
        .select("id");

      assert.deepEqual(data, []);
    });

    it("membro de A não se adiciona à organização B", async () => {
      const { error } = await c.membroA.client
        .from("organization_members")
        .insert({ organization_id: c.orgB, profile_id: c.membroA.id });

      assert.ok(error, "a política de insert deveria recusar");
    });

    it("membro de A não move o próprio evento para a organização B", async () => {
      const { data, error } = await c.membroA.client
        .from("events")
        .update({ organization_id: c.orgB })
        .eq("id", c.eventos.aRascunho)
        .select("id");

      // `with check` violado vira erro; `using` que não casa vira zero linhas.
      // Qualquer um dos dois é aceitável — o que não pode é a mudança valer.
      assert.ok(
        error || (data ?? []).length === 0,
        "o `with check` deveria barrar a mudança de dono",
      );

      const { data: depois } = await c.membroA.client
        .from("events")
        .select("organization_id")
        .eq("id", c.eventos.aRascunho)
        .single();

      assert.equal(depois.organization_id, c.orgA, "o evento continua na organização A");
    });
  });

  describe("escalada de privilégio", () => {
    it("usuário não se promove a admin", async () => {
      const { error } = await c.cliente.client
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", c.cliente.id);

      assert.ok(error, "o trigger deveria recusar a mudança de papel");

      const { data } = await c.cliente.client
        .from("profiles")
        .select("role")
        .eq("id", c.cliente.id)
        .single();

      assert.equal(data.role, "cliente");
    });

    it("usuário edita o próprio nome, mas não o de outro", async () => {
      const { data: proprio } = await c.cliente.client
        .from("profiles")
        .update({ display_name: "Nome novo" })
        .eq("id", c.cliente.id)
        .select("display_name")
        .maybeSingle();

      assert.equal(proprio?.display_name, "Nome novo");

      const { data: alheio } = await c.cliente.client
        .from("profiles")
        .update({ display_name: "Invadido" })
        .eq("id", c.membroB.id)
        .select("id");

      assert.deepEqual(alheio, []);
    });

    it("cliente comum não cadastra organização", async () => {
      const { error } = await c.cliente.client
        .from("organizations")
        .insert({ name: "Organização pirata", plan: "parceiro" });

      assert.ok(error, "só admin da plataforma cadastra organização");
    });

    it("cliente não cria evento em nome de outra pessoa", async () => {
      const { error } = await c.cliente.client.from("events").insert({
        slug: `forjado-${c.tag}`,
        host_profile_id: c.membroB.id,
        kind: "casamento",
        title: "Forjado",
        event_at: "2027-05-05T18:00:00-03:00",
      });

      assert.ok(error, "o `with check` exige host_profile_id = auth.uid()");
    });
  });

  describe("admin da plataforma", () => {
    it("enxerga as duas organizações", async () => {
      const { data } = await c.plataforma.client
        .from("organizations")
        .select("id")
        .in("id", [c.orgA, c.orgB]);

      assert.equal(data.length, 2);
    });

    it("enxerga rascunho de qualquer organização", async () => {
      const { data } = await c.plataforma.client
        .from("events")
        .select("id")
        .in("id", [c.eventos.aRascunho, c.eventos.bRascunho]);

      assert.equal(data.length, 2);
    });
  });

  describe("composição da organização", () => {
    it("a organização não fica sem proprietário", async () => {
      const { error } = await c.membroA.client
        .from("organization_members")
        .delete()
        .eq("organization_id", c.orgA)
        .eq("profile_id", c.membroA.id);

      assert.ok(error, "remover o último proprietário deveria ser recusado");

      const { data } = await c.membroA.client
        .from("organization_members")
        .select("profile_id")
        .eq("organization_id", c.orgA);

      assert.equal(data.length, 1, "a composição deveria continuar intacta");
    });
  });
});
