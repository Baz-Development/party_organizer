import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { admin, anonimo, montarCenario } from "./harness.mjs";

/**
 * Cenários das specs `presentes` de `add-gifts-payments-backend`, contra o
 * banco local. Cobre RLS de `gifts`/`gift_reservations` e a concorrência de
 * `start_gift_checkout` (reserva de presente simples e contribuição de cota).
 *
 * Pré-requisito: `npm run db:start`.
 */
describe("presentes", () => {
  let c;
  let giftSimples;
  let giftCota;

  before(async () => {
    c = await montarCenario();

    await admin.from("event_modules").insert({ event_id: c.eventos.aPublicado, module: "presentes" });

    const { data: gifts, error } = await admin
      .from("gifts")
      .insert([
        { event_id: c.eventos.aPublicado, name: "Jogo de panelas", category: "Cozinha", price_cents: 42000 },
        {
          event_id: c.eventos.aPublicado,
          name: "Lua de mel",
          category: "Lua de mel",
          price_cents: 10000,
          quota_target_cents: 60000,
        },
      ])
      .select("id, quota_target_cents");
    if (error) throw new Error(`Falha ao criar presentes: ${error.message}`);

    giftSimples = gifts.find((g) => g.quota_target_cents === null).id;
    giftCota = gifts.find((g) => g.quota_target_cents !== null).id;

    await admin
      .from("gifts")
      .insert({ event_id: c.eventos.aRascunho, name: "Presente de rascunho", category: "Casa", price_cents: 1000 });
  });

  after(async () => {
    await c.limpar();
  });

  describe("catálogo público", () => {
    it("evento publicado mostra presentes a quem não tem conta", async () => {
      const { data } = await anonimo.from("gifts").select("id").eq("event_id", c.eventos.aPublicado);
      assert.equal(data.length, 2);
    });

    it("evento em rascunho não revela presente nenhum", async () => {
      const { data } = await anonimo.from("gifts").select("id").eq("event_id", c.eventos.aRascunho);
      assert.deepEqual(data, []);
    });

    it("convidado não lê gift_reservations diretamente", async () => {
      const { error } = await anonimo.from("gift_reservations").select("buyer_name");
      assert.ok(error, "sem grant/política de select para anon");
    });
  });

  describe("gestão do catálogo", () => {
    it("quem administra o evento cadastra presente", async () => {
      const { data, error } = await c.membroA.client
        .from("gifts")
        .insert({ event_id: c.eventos.aPublicado, name: "Air fryer", category: "Cozinha", price_cents: 50000 })
        .select("id, status")
        .single();

      assert.equal(error, null);
      assert.equal(data.status, "disponivel");
    });

    it("preço ausente é recusado pela constraint", async () => {
      const { error } = await c.membroA.client
        .from("gifts")
        .insert({ event_id: c.eventos.aPublicado, name: "Sem preço", category: "Casa", price_cents: 0 });

      assert.ok(error, "price_cents > 0 deveria recusar zero");
    });

    it("quem não administra o evento não cadastra presente", async () => {
      const { error } = await c.membroB.client
        .from("gifts")
        .insert({ event_id: c.eventos.aPublicado, name: "Intruso", category: "Casa", price_cents: 1000 });

      assert.ok(error, "o `with check` de gifts_manage deveria recusar");
    });
  });

  describe("reserva de presente simples", () => {
    it("reserva bem-sucedida marca o presente reservado", async () => {
      const { data, error } = await anonimo
        .rpc("start_gift_checkout", {
          p_event_slug: `a-publicado-${c.tag}`,
          p_gift_id: giftSimples,
          p_amount_cents: null,
          p_buyer_name: "Rafael",
          p_buyer_email: null,
        })
        .single();

      assert.equal(error, null);
      assert.equal(data.amount_cents, 42000);

      const { data: gift } = await admin.from("gifts").select("status").eq("id", giftSimples).single();
      assert.equal(gift.status, "reservado");
    });

    it("segunda tentativa concorrente é recusada", async () => {
      const { error } = await anonimo.rpc("start_gift_checkout", {
        p_event_slug: `a-publicado-${c.tag}`,
        p_gift_id: giftSimples,
        p_amount_cents: null,
        p_buyer_name: "Outro Convidado",
        p_buyer_email: null,
      });

      assert.ok(error);
      assert.match(error.message, /presente_reservado/);
    });

    it("reserva expirada libera o presente para nova reserva", async () => {
      await admin
        .from("gift_reservations")
        .update({ expires_at: "2000-01-01T00:00:00Z" })
        .eq("gift_id", giftSimples)
        .eq("status", "ativa");

      const { data, error } = await anonimo
        .rpc("start_gift_checkout", {
          p_event_slug: `a-publicado-${c.tag}`,
          p_gift_id: giftSimples,
          p_amount_cents: null,
          p_buyer_name: "Juliana",
          p_buyer_email: null,
        })
        .single();

      assert.equal(error, null);
      assert.ok(data.payment_id);

      const { data: reservations } = await admin
        .from("gift_reservations")
        .select("status")
        .eq("gift_id", giftSimples)
        .order("created_at");
      assert.equal(reservations[0].status, "expirada");
      assert.equal(reservations[1].status, "ativa");
    });

    it("presente já comprado recusa nova reserva", async () => {
      const { data: comprado } = await admin
        .from("gifts")
        .insert({ event_id: c.eventos.aPublicado, name: "Já comprado", category: "Casa", price_cents: 1000, status: "comprado" })
        .select("id")
        .single();

      const { error } = await anonimo.rpc("start_gift_checkout", {
        p_event_slug: `a-publicado-${c.tag}`,
        p_gift_id: comprado.id,
        p_amount_cents: null,
        p_buyer_name: "Tarde Demais",
        p_buyer_email: null,
      });

      assert.ok(error);
      assert.match(error.message, /presente_indisponivel/);
    });
  });

  describe("contribuição de cota", () => {
    it("contribuição acima do restante é recusada com o valor máximo", async () => {
      const { error } = await anonimo.rpc("start_gift_checkout", {
        p_event_slug: `a-publicado-${c.tag}`,
        p_gift_id: giftCota,
        p_amount_cents: 70000,
        p_buyer_name: "Ambicioso",
        p_buyer_email: null,
      });

      assert.ok(error);
      assert.match(error.message, /valor_excede_restante:60000/);

      const { data: gift } = await admin.from("gifts").select("quota_reserved_cents").eq("id", giftCota).single();
      assert.equal(gift.quota_reserved_cents, 0, "contribuição recusada não deveria reservar nada");
    });

    it("duas contribuições simultâneas somam exato sem ultrapassar a meta", async () => {
      const chamada = (nome, valor) =>
        anonimo
          .rpc("start_gift_checkout", {
            p_event_slug: `a-publicado-${c.tag}`,
            p_gift_id: giftCota,
            p_amount_cents: valor,
            p_buyer_name: nome,
            p_buyer_email: null,
          })
          .single();

      const [a, b] = await Promise.all([chamada("Convidado 1", 35000), chamada("Convidado 2", 25000)]);

      assert.equal(a.error, null, a.error?.message);
      assert.equal(b.error, null, b.error?.message);

      const { data: gift } = await admin
        .from("gifts")
        .select("quota_reserved_cents, quota_raised_cents, quota_target_cents")
        .eq("id", giftCota)
        .single();

      assert.equal(gift.quota_reserved_cents, 60000, "as duas contribuições deveriam estar reservadas");
      assert.ok(
        gift.quota_reserved_cents + gift.quota_raised_cents <= gift.quota_target_cents,
        "a soma não pode ultrapassar a meta",
      );
    });

    it("uma terceira contribuição não encontra mais espaço", async () => {
      const { error } = await anonimo.rpc("start_gift_checkout", {
        p_event_slug: `a-publicado-${c.tag}`,
        p_gift_id: giftCota,
        p_amount_cents: 1,
        p_buyer_name: "Sem Espaço",
        p_buyer_email: null,
      });

      assert.ok(error);
      assert.match(error.message, /valor_excede_restante:0/);
    });
  });

  describe("checkout de evento indisponível", () => {
    it("evento em rascunho recusa checkout", async () => {
      const { data: gift } = await admin
        .from("gifts")
        .select("id")
        .eq("event_id", c.eventos.aRascunho)
        .limit(1)
        .single();

      const { error } = await anonimo.rpc("start_gift_checkout", {
        p_event_slug: `a-rascunho-${c.tag}`,
        p_gift_id: gift.id,
        p_amount_cents: null,
        p_buyer_name: "Visitante",
        p_buyer_email: null,
      });

      assert.ok(error);
      assert.match(error.message, /evento_indisponivel/);
    });

    it("evento publicado sem o módulo de presentes habilitado recusa checkout", async () => {
      await admin
        .from("event_modules")
        .delete()
        .eq("event_id", c.eventos.aPublicado)
        .eq("module", "presentes");

      const { data: outroPresente } = await admin
        .from("gifts")
        .insert({ event_id: c.eventos.aPublicado, name: "Sem módulo", category: "Casa", price_cents: 1000 })
        .select("id")
        .single();

      const { error } = await anonimo.rpc("start_gift_checkout", {
        p_event_slug: `a-publicado-${c.tag}`,
        p_gift_id: outroPresente.id,
        p_amount_cents: null,
        p_buyer_name: "Visitante",
        p_buyer_email: null,
      });

      assert.ok(error);
      assert.match(error.message, /modulo_desabilitado/);

      await admin.from("event_modules").insert({ event_id: c.eventos.aPublicado, module: "presentes" });
    });
  });
});
