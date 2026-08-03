import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { admin, anonimo, montarCenario } from "./harness.mjs";

/**
 * Cenários das specs `pagamentos` de `add-gifts-payments-backend`, contra o
 * banco local. Cobre RLS de `payments`/`payment_events` e a lógica de
 * `process_payment_event` (aprovação, recusa, reembolso, idempotência) —
 * a mesma função que a rota `POST /api/pagamentos/webhook` chama depois de
 * verificar a assinatura, aqui exercitada diretamente com o client
 * `service_role`, exatamente como a rota faz.
 *
 * Pré-requisito: `npm run db:start`.
 */
describe("pagamentos", () => {
  let c;

  const iniciarCheckout = async (giftId, amountCents, buyerName) => {
    const { data, error } = await anonimo
      .rpc("start_gift_checkout", {
        p_event_slug: `a-publicado-${c.tag}`,
        p_gift_id: giftId,
        p_amount_cents: amountCents,
        p_buyer_name: buyerName,
        p_buyer_email: null,
      })
      .single();
    if (error) throw new Error(`Falha ao iniciar checkout: ${error.message}`);
    return data;
  };

  const criarPresenteSimples = async (nome = "Presente") => {
    const { data, error } = await admin
      .from("gifts")
      .insert({ event_id: c.eventos.aPublicado, name: nome, category: "Casa", price_cents: 10000 })
      .select("id")
      .single();
    if (error) throw new Error(`Falha ao criar presente: ${error.message}`);
    return data.id;
  };

  before(async () => {
    c = await montarCenario();
    await admin.from("event_modules").insert({ event_id: c.eventos.aPublicado, module: "presentes" });
  });

  after(async () => {
    await c.limpar();
  });

  describe("acesso restrito", () => {
    it("convidado não lê payments", async () => {
      const { error } = await anonimo.from("payments").select("id");
      assert.ok(error, "sem grant/política de select para anon");
    });

    it("convidado não lê payment_events", async () => {
      const { error } = await anonimo.from("payment_events").select("id");
      assert.ok(error);
    });

    it("organização de outro evento não lê o pagamento", async () => {
      const giftId = await criarPresenteSimples("Presente de A");
      const checkout = await iniciarCheckout(giftId, null, "Comprador");

      const { data: paraA } = await c.membroA.client
        .from("payments")
        .select("id")
        .eq("id", checkout.payment_id)
        .maybeSingle();
      assert.ok(paraA, "quem administra o evento deveria ver o próprio pagamento");

      const { data: paraB } = await c.membroB.client
        .from("payments")
        .select("id")
        .eq("id", checkout.payment_id)
        .maybeSingle();
      assert.equal(paraB, null, "organização de outro evento não pode ver este pagamento");
    });

    it("anon não executa process_payment_event", async () => {
      const giftId = await criarPresenteSimples("Presente protegido");
      const checkout = await iniciarCheckout(giftId, null, "Comprador");

      const { error } = await anonimo.rpc("process_payment_event", {
        p_payment_id: checkout.payment_id,
        p_provider_payment_id: "forjado",
        p_event_type: "aprovado",
        p_amount_cents: checkout.amount_cents,
      });

      assert.ok(error, "só service_role deveria ter grant de execute nesta função");
    });
  });

  describe("aprovação de presente simples", () => {
    it("aprova o pagamento e marca o presente comprado", async () => {
      const giftId = await criarPresenteSimples("Robô aspirador");
      const checkout = await iniciarCheckout(giftId, null, "Comprador Feliz");

      const { data, error } = await admin
        .rpc("process_payment_event", {
          p_payment_id: checkout.payment_id,
          p_provider_payment_id: "prov_123",
          p_event_type: "aprovado",
          p_amount_cents: checkout.amount_cents,
        })
        .single();

      assert.equal(error, null);
      assert.equal(data.applied, true);

      const { data: gift } = await admin.from("gifts").select("status").eq("id", giftId).single();
      assert.equal(gift.status, "comprado");

      const { data: payment } = await admin
        .from("payments")
        .select("status, confirmed_at")
        .eq("id", checkout.payment_id)
        .single();
      assert.equal(payment.status, "pago");
      assert.ok(payment.confirmed_at);
    });

    it("a mesma notificação entregue de novo é aceita sem reprocessar", async () => {
      const giftId = await criarPresenteSimples("Cafeteira");
      const checkout = await iniciarCheckout(giftId, null, "Comprador Duplicado");

      const primeira = await admin
        .rpc("process_payment_event", {
          p_payment_id: checkout.payment_id,
          p_provider_payment_id: "prov_dup",
          p_event_type: "aprovado",
          p_amount_cents: checkout.amount_cents,
        })
        .single();
      assert.equal(primeira.data.applied, true);

      const segunda = await admin
        .rpc("process_payment_event", {
          p_payment_id: checkout.payment_id,
          p_provider_payment_id: "prov_dup",
          p_event_type: "aprovado",
          p_amount_cents: checkout.amount_cents,
        })
        .single();
      assert.equal(segunda.data.applied, false);
      assert.equal(segunda.data.reason, "ja_processado");
    });

    it("pagamento recusado libera a reserva", async () => {
      const giftId = await criarPresenteSimples("Toalhas");
      const checkout = await iniciarCheckout(giftId, null, "Comprador Desistente");

      const { data } = await admin
        .rpc("process_payment_event", {
          p_payment_id: checkout.payment_id,
          p_provider_payment_id: "prov_recusado",
          p_event_type: "recusado",
          p_amount_cents: checkout.amount_cents,
        })
        .single();
      assert.equal(data.applied, true);

      const { data: gift } = await admin.from("gifts").select("status").eq("id", giftId).single();
      assert.equal(gift.status, "disponivel");

      const { data: payment } = await admin.from("payments").select("status").eq("id", checkout.payment_id).single();
      assert.equal(payment.status, "falho");
    });

    it("reembolso reverte o presente para disponível e sai do arrecadado", async () => {
      const giftId = await criarPresenteSimples("Jogo de cama");
      const checkout = await iniciarCheckout(giftId, null, "Comprador Reembolsado");

      await admin.rpc("process_payment_event", {
        p_payment_id: checkout.payment_id,
        p_provider_payment_id: "prov_reembolso",
        p_event_type: "aprovado",
        p_amount_cents: checkout.amount_cents,
      });

      const { data } = await admin
        .rpc("process_payment_event", {
          p_payment_id: checkout.payment_id,
          p_provider_payment_id: "prov_reembolso",
          p_event_type: "reembolsado",
          p_amount_cents: checkout.amount_cents,
        })
        .single();
      assert.equal(data.applied, true);

      const { data: gift } = await admin.from("gifts").select("status").eq("id", giftId).single();
      assert.equal(gift.status, "disponivel");

      const { data: payment } = await admin
        .from("payments")
        .select("status, refunded_at")
        .eq("id", checkout.payment_id)
        .single();
      assert.equal(payment.status, "reembolsado");
      assert.ok(payment.refunded_at);
    });

    it("reembolsar um pagamento que não está pago é recusado", async () => {
      const giftId = await criarPresenteSimples("Sem pagamento");
      const checkout = await iniciarCheckout(giftId, null, "Comprador Pendente");

      const { data } = await admin
        .rpc("process_payment_event", {
          p_payment_id: checkout.payment_id,
          p_provider_payment_id: "prov_invalido",
          p_event_type: "reembolsado",
          p_amount_cents: checkout.amount_cents,
        })
        .single();

      assert.equal(data.applied, false);
      assert.equal(data.reason, "estado_invalido_para_reembolso");
    });
  });

  describe("contribuição de cota", () => {
    it("aprovar contribuições soma o arrecadado e completa a meta", async () => {
      const { data: gift } = await admin
        .from("gifts")
        .insert({
          event_id: c.eventos.aPublicado,
          name: "Cota do apê",
          category: "Casa",
          price_cents: 10000,
          quota_target_cents: 20000,
        })
        .select("id")
        .single();

      const checkoutA = await iniciarCheckout(gift.id, 12000, "Contribuinte 1");
      const checkoutB = await iniciarCheckout(gift.id, 8000, "Contribuinte 2");

      await admin.rpc("process_payment_event", {
        p_payment_id: checkoutA.payment_id,
        p_provider_payment_id: "cota_a",
        p_event_type: "aprovado",
        p_amount_cents: checkoutA.amount_cents,
      });

      let { data: meio } = await admin
        .from("gifts")
        .select("quota_raised_cents, quota_reserved_cents, status")
        .eq("id", gift.id)
        .single();
      assert.equal(meio.quota_raised_cents, 12000);
      assert.equal(meio.quota_reserved_cents, 8000);
      assert.equal(meio.status, "disponivel");

      await admin.rpc("process_payment_event", {
        p_payment_id: checkoutB.payment_id,
        p_provider_payment_id: "cota_b",
        p_event_type: "aprovado",
        p_amount_cents: checkoutB.amount_cents,
      });

      const { data: final } = await admin
        .from("gifts")
        .select("quota_raised_cents, quota_reserved_cents, status")
        .eq("id", gift.id)
        .single();
      assert.equal(final.quota_raised_cents, 20000);
      assert.equal(final.quota_reserved_cents, 0);
      assert.equal(final.status, "comprado");
    });

    it("reembolso de contribuição reabre a cota completa", async () => {
      const { data: gift } = await admin
        .from("gifts")
        .insert({
          event_id: c.eventos.aPublicado,
          name: "Cota reembolsável",
          category: "Casa",
          price_cents: 10000,
          quota_target_cents: 10000,
        })
        .select("id")
        .single();

      const checkout = await iniciarCheckout(gift.id, 10000, "Contribuinte único");
      await admin.rpc("process_payment_event", {
        p_payment_id: checkout.payment_id,
        p_provider_payment_id: "cota_unica",
        p_event_type: "aprovado",
        p_amount_cents: checkout.amount_cents,
      });

      let { data: completa } = await admin.from("gifts").select("status").eq("id", gift.id).single();
      assert.equal(completa.status, "comprado");

      await admin.rpc("process_payment_event", {
        p_payment_id: checkout.payment_id,
        p_provider_payment_id: "cota_unica",
        p_event_type: "reembolsado",
        p_amount_cents: checkout.amount_cents,
      });

      const { data: reaberta } = await admin
        .from("gifts")
        .select("status, quota_raised_cents")
        .eq("id", gift.id)
        .single();
      assert.equal(reaberta.status, "disponivel");
      assert.equal(reaberta.quota_raised_cents, 0);
    });
  });
});
