import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { admin, montarCenario } from "./harness.mjs";
import { backoffMinutes, isEssentialTemplate, isSuppressed, MAX_ATTEMPTS } from "../src/lib/email/policy.ts";

/**
 * Cenários da fila de e-mail (`add-transactional-emails`) contra o banco
 * local, mais as regras puras de `src/lib/email/policy.ts`.
 *
 * `src/lib/email/processQueue.ts`/`enqueue.ts`/`index.ts` importam
 * `"server-only"`, que lança ao ser importado fora do bundle do Next — por
 * isso, como já acontece em `tests/webhook.test.mjs`, este arquivo só
 * importa direto o módulo sem esse import (`policy.ts`, extraído
 * exatamente para ser testável). A orquestração de `processQueue.ts`
 * (chamar o provedor, escrever o resultado de volta, nunca usar o endereço
 * real fora de produção, nunca persistir o token) é coberta por revisão de
 * código e pelo contrato de tipos — `enqueueEmail` não tem parâmetro de
 * segredo/token, então não há caminho para persisti-lo por engano — não por
 * um teste automatizado ponta a ponta, que exigiria subir o servidor Next
 * dentro da suíte (nenhum outro teste deste projeto faz isso hoje).
 *
 * Pré-requisito: `npm run db:start`.
 */
describe("regras puras da fila (policy.ts)", () => {
  it("backoff cresce exponencialmente com teto de 30 minutos", () => {
    assert.equal(backoffMinutes(1), 2);
    assert.equal(backoffMinutes(2), 4);
    assert.equal(backoffMinutes(3), 8);
    assert.equal(backoffMinutes(4), 16);
    assert.equal(backoffMinutes(5), 30, "2^5=32 deveria ser limitado a 30");
    assert.equal(backoffMinutes(10), 30);
  });

  it("recibo_presente é a única mensagem essencial", () => {
    assert.equal(isEssentialTemplate("recibo_presente"), true);
    assert.equal(isEssentialTemplate("convite"), false);
    assert.equal(isEssentialTemplate("revelacao_amigo_secreto"), false);
  });

  it("sem supressão, nada é bloqueado", () => {
    assert.equal(isSuppressed(null, "convite"), false);
    assert.equal(isSuppressed(null, "recibo_presente"), false);
  });

  it("retorno permanente bloqueia até mensagem essencial", () => {
    assert.equal(isSuppressed("retorno_permanente", "convite"), true);
    assert.equal(isSuppressed("retorno_permanente", "recibo_presente"), true);
  });

  it("descadastro bloqueia mensagem comum mas não a essencial", () => {
    assert.equal(isSuppressed("descadastro", "convite"), true);
    assert.equal(isSuppressed("descadastro", "recibo_presente"), false);
  });

  it("MAX_ATTEMPTS é positivo e pequeno o bastante para não deixar mensagem pendente para sempre", () => {
    assert.ok(MAX_ATTEMPTS >= 1 && MAX_ATTEMPTS <= 10);
  });
});

describe("fila de e-mail (banco)", () => {
  let c;

  before(async () => {
    c = await montarCenario();
  });

  after(async () => {
    await c.limpar();
  });

  async function criarMensagem(overrides = {}) {
    const { data, error } = await admin
      .from("email_messages")
      .insert({
        event_id: c.eventos.aPublicado,
        recipient_email: "destinatario@teste.local",
        template: "convite",
        data: { eventTitle: "Evento", eventSlug: "x" },
        ...overrides,
      })
      .select("*")
      .single();
    if (error) throw new Error(`Falha ao criar mensagem: ${error.message}`);
    return data;
  }

  it("mensagem nova nasce pendente, pronta para reivindicação imediata", async () => {
    const msg = await criarMensagem();
    assert.equal(msg.status, "pendente");
    assert.equal(msg.attempts, 0);

    // Tolerância de alguns segundos: relógio do container do banco pode
    // divergir levemente do relógio de quem roda o teste.
    const diffMs = new Date(msg.next_attempt_at).getTime() - Date.now();
    assert.ok(diffMs < 5_000, "next_attempt_at não deveria estar muito no futuro");

    const { data: reivindicada } = await admin.rpc("claim_pending_email_messages", { p_limit: 50 });
    assert.ok(
      reivindicada.some((m) => m.id === msg.id),
      "mensagem recém-criada deveria estar imediatamente elegível para reivindicação",
    );
  });

  it("claim_pending_email_messages reivindica só o que está pendente e no prazo", async () => {
    const pendente = await criarMensagem();
    const futura = await criarMensagem({ next_attempt_at: new Date(Date.now() + 3_600_000).toISOString() });
    const jaEnviando = await criarMensagem();
    await admin.from("email_messages").update({ status: "enviando" }).eq("id", jaEnviando.id);

    const { data: claimed, error } = await admin.rpc("claim_pending_email_messages", { p_limit: 10 });
    assert.equal(error, null);

    const ids = claimed.map((m) => m.id);
    assert.ok(ids.includes(pendente.id), "mensagem pendente e no prazo deveria ser reivindicada");
    assert.ok(!ids.includes(futura.id), "mensagem agendada para o futuro não deveria ser reivindicada ainda");
    assert.ok(!ids.includes(jaEnviando.id), "mensagem já em 'enviando' não deveria ser reivindicada de novo");

    const { data: depois } = await admin
      .from("email_messages")
      .select("status")
      .eq("id", pendente.id)
      .single();
    assert.equal(depois.status, "enviando", "reivindicar deveria mudar o status para 'enviando'");
  });

  it("claim_pending_email_messages respeita o limite", async () => {
    await Promise.all([criarMensagem(), criarMensagem(), criarMensagem()]);

    const { data: claimed } = await admin.rpc("claim_pending_email_messages", { p_limit: 2 });
    assert.equal(claimed.length, 2);
  });

  it("duas reivindicações concorrentes não pegam a mesma mensagem (skip locked)", async () => {
    await Promise.all(Array.from({ length: 6 }, () => criarMensagem()));

    const [primeira, segunda] = await Promise.all([
      admin.rpc("claim_pending_email_messages", { p_limit: 3 }),
      admin.rpc("claim_pending_email_messages", { p_limit: 3 }),
    ]);

    const idsPrimeira = new Set(primeira.data.map((m) => m.id));
    const idsSegunda = new Set(segunda.data.map((m) => m.id));
    const intersecao = [...idsPrimeira].filter((id) => idsSegunda.has(id));

    assert.deepEqual(intersecao, [], "as duas reivindicações não deveriam se sobrepor");
  });

  it("retentativa: mensagem volta para pendente com next_attempt_at no futuro respeita o backoff calculado", async () => {
    const msg = await criarMensagem();
    const tentativa = 1;
    const proxima = new Date(Date.now() + backoffMinutes(tentativa) * 60_000);

    await admin
      .from("email_messages")
      .update({
        status: "pendente",
        attempts: tentativa,
        next_attempt_at: proxima.toISOString(),
        last_error: "falha_temporaria_simulada",
      })
      .eq("id", msg.id);

    const { data: naoReivindicada } = await admin.rpc("claim_pending_email_messages", { p_limit: 50 });
    assert.ok(
      !naoReivindicada.some((m) => m.id === msg.id),
      "mensagem reagendada para o futuro não deveria ser reivindicada antes da hora",
    );
  });

  it("falha permanente marca a mensagem como falha e não fica mais elegível", async () => {
    const msg = await criarMensagem();
    await admin
      .from("email_messages")
      .update({ status: "falha", attempts: MAX_ATTEMPTS, last_error: "limite_de_tentativas" })
      .eq("id", msg.id);

    const { data: reivindicadas } = await admin.rpc("claim_pending_email_messages", { p_limit: 50 });
    assert.ok(!reivindicadas.some((m) => m.id === msg.id));
  });

  describe("supressão", () => {
    it("retorno permanente registrado impede novo envio (nível de dado)", async () => {
      const email = `bounce-${c.tag}@teste.local`;
      await admin
        .from("email_suppressions")
        .insert({ event_id: c.eventos.aPublicado, email, reason: "retorno_permanente" });

      const { data } = await admin
        .from("email_suppressions")
        .select("reason")
        .eq("event_id", c.eventos.aPublicado)
        .eq("email", email)
        .single();

      assert.equal(isSuppressed(data.reason, "convite"), true);
      assert.equal(isSuppressed(data.reason, "recibo_presente"), true, "retorno permanente nunca é ignorado");
    });

    it("descadastro registrado não impede recibo de pagamento", async () => {
      const email = `descadastrado-${c.tag}@teste.local`;
      await admin
        .from("email_suppressions")
        .insert({ event_id: c.eventos.aPublicado, email, reason: "descadastro" });

      const { data } = await admin
        .from("email_suppressions")
        .select("reason")
        .eq("event_id", c.eventos.aPublicado)
        .eq("email", email)
        .single();

      assert.equal(isSuppressed(data.reason, "convite"), true);
      assert.equal(isSuppressed(data.reason, "recibo_presente"), false);
    });

    it("email_suppressions não duplica o mesmo endereço no mesmo evento", async () => {
      const email = `unico-${c.tag}@teste.local`;
      await admin
        .from("email_suppressions")
        .insert({ event_id: c.eventos.aPublicado, email, reason: "descadastro" });

      const { error } = await admin
        .from("email_suppressions")
        .insert({ event_id: c.eventos.aPublicado, email, reason: "retorno_permanente" });

      assert.ok(error, "unique (event_id, email) deveria recusar a segunda linha");
    });
  });
});
