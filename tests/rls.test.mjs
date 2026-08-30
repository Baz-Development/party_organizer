import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { admin, anonimo, montarCenario } from "./harness.mjs";

/**
 * Testes de política contra o banco local.
 *
 * Uma RLS mal escrita vaza dados entre anfitriões — é o risco mais grave
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

      assert.ok(data, "o anfitrião do evento deveria ver o próprio rascunho");
    });

    it("cronograma de rascunho não vaza junto", async () => {
      const { data } = await anonimo
        .from("schedule_items")
        .select("id")
        .eq("event_id", c.eventos.aRascunho);

      assert.deepEqual(data, []);
    });
  });

  describe("isolamento entre anfitriões", () => {
    it("anfitrião A não lê rascunho de B", async () => {
      const { data } = await c.membroA.client
        .from("events")
        .select("id, title, welcome")
        .eq("id", c.eventos.bRascunho)
        .maybeSingle();

      assert.equal(data, null, "nenhum campo do evento de B pode ser revelado");
    });

    it("anfitrião A não altera evento de B", async () => {
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

    it("anfitrião A não apaga evento de B", async () => {
      const { data } = await c.membroA.client
        .from("events")
        .delete()
        .eq("id", c.eventos.bRascunho)
        .select("id");

      assert.deepEqual(data, []);
    });

    it("anfitrião A não transfere o próprio evento para B", async () => {
      const { data, error } = await c.membroA.client
        .from("events")
        .update({ host_profile_id: c.membroB.id })
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
        .select("host_profile_id")
        .eq("id", c.eventos.aRascunho)
        .single();

      assert.equal(depois.host_profile_id, c.membroA.id, "o evento continua com o anfitrião A");
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
    it("enxerga rascunho de qualquer anfitrião", async () => {
      const { data } = await c.plataforma.client
        .from("events")
        .select("id")
        .in("id", [c.eventos.aRascunho, c.eventos.bRascunho]);

      assert.equal(data.length, 2);
    });
  });

  describe("amigo secreto — sigilo dos pares (add-secret-santa-backend)", () => {
    it("nenhum papel comum alcança secret_santa_assignments por select direto", async () => {
      const { error: comoAnon } = await anonimo.from("secret_santa_assignments").select("id");
      assert.ok(comoAnon);

      const { error: comoAdmin } = await c.membroA.client
        .from("secret_santa_assignments")
        .select("id");
      assert.ok(comoAdmin);

      const { error: comoPlataforma } = await c.plataforma.client
        .from("secret_santa_assignments")
        .select("id");
      assert.ok(comoPlataforma, "nem admin da plataforma deveria ler um par direto da tabela");
    });

    it("nenhum papel comum alcança secret_santa_reveals por select direto", async () => {
      const { error: comoAnon } = await anonimo.from("secret_santa_reveals").select("*");
      assert.ok(comoAnon);

      const { error: comoPlataforma } = await c.plataforma.client
        .from("secret_santa_reveals")
        .select("*");
      assert.ok(comoPlataforma);
    });

    it("nenhum papel comum alcança secret_santa_wishlists por select direto", async () => {
      const { error: comoAnon } = await anonimo.from("secret_santa_wishlists").select("*");
      assert.ok(comoAnon);

      const { error: comoAdmin } = await c.membroA.client
        .from("secret_santa_wishlists")
        .select("*");
      assert.ok(comoAdmin, "wishlist só sai pela função de revelação, nunca por select direto");
    });
  });

  describe("fila e supressão de e-mail", () => {
    it("nenhum papel comum alcança email_messages de outro anfitrião; quem administra lê a própria", async () => {
      const { data: msg } = await admin
        .from("email_messages")
        .insert({
          event_id: c.eventos.aPublicado,
          recipient_email: "convidado@teste.local",
          template: "convite",
          data: { eventTitle: "Evento", eventSlug: "x" },
        })
        .select("id")
        .single();

      const { error: comoAnon } = await anonimo.from("email_messages").select("*").eq("id", msg.id);
      assert.ok(comoAnon, "anon não tem grant de select em email_messages");

      const { data: comoIntruso } = await c.membroB.client
        .from("email_messages")
        .select("id")
        .eq("id", msg.id);
      assert.deepEqual(comoIntruso, [], "outro anfitrião não lê o histórico de A");

      const { data: comoDono } = await c.membroA.client
        .from("email_messages")
        .select("id")
        .eq("id", msg.id);
      assert.equal(comoDono.length, 1, "quem administra o evento lê o próprio histórico");
    });

    it("anon não insere em email_messages diretamente — só via enfileiramento server-only", async () => {
      const { error } = await anonimo.from("email_messages").insert({
        event_id: c.eventos.aPublicado,
        recipient_email: "forjado@teste.local",
        template: "convite",
        data: {},
      });
      assert.ok(error, "email_messages não tem grant de insert para anon/authenticated");
    });

    it("email_suppressions só é lida/gerida por quem administra o evento", async () => {
      const { data: sup } = await admin
        .from("email_suppressions")
        .insert({ event_id: c.eventos.aPublicado, email: "suprimido@teste.local", reason: "descadastro" })
        .select("id")
        .single();

      const { error: comoAnon } = await anonimo.from("email_suppressions").select("*").eq("id", sup.id);
      assert.ok(comoAnon);

      const { data: comoIntruso } = await c.membroB.client
        .from("email_suppressions")
        .select("id")
        .eq("id", sup.id);
      assert.deepEqual(comoIntruso, []);

      const { data: comoDono } = await c.membroA.client
        .from("email_suppressions")
        .select("id")
        .eq("id", sup.id);
      assert.equal(comoDono.length, 1);
    });

    it("unsubscribe_email funciona sem conta e é idempotente", async () => {
      const email = "descadastro-rls@teste.local";

      const { error: primeira } = await anonimo.rpc("unsubscribe_email", {
        p_event_id: c.eventos.aPublicado,
        p_email: email,
      });
      assert.equal(primeira, null);

      const { error: segunda } = await anonimo.rpc("unsubscribe_email", {
        p_event_id: c.eventos.aPublicado,
        p_email: email,
      });
      assert.equal(segunda, null, "descadastrar duas vezes não deveria dar erro");

      const { count } = await admin
        .from("email_suppressions")
        .select("id", { count: "exact", head: true })
        .eq("event_id", c.eventos.aPublicado)
        .eq("email", email);
      assert.equal(count, 1, "não deveria duplicar a linha de supressão");
    });
  });
});
