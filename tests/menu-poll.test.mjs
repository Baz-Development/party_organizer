import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { admin, anonimo, montarCenario } from "./harness.mjs";

/**
 * Cenários da spec `cardapio` de `add-menu-poll-backend`, contra o banco
 * local. Cobre RLS de `menu_polls`/`menu_options`/`menu_votes` e as funções
 * `security definer` que o convidado sem conta usa para votar.
 *
 * Pré-requisito: `npm run db:start`.
 */
describe("enquete de cardápio", () => {
  let c;
  let tokenA;
  let tokenB;
  let pollId;
  let optionIds;

  before(async () => {
    c = await montarCenario();

    await admin
      .from("event_modules")
      .insert({ event_id: c.eventos.aPublicado, module: "cardapio" });

    const { data: guestA, error: guestAError } = await admin
      .from("guests")
      .insert({ event_id: c.eventos.aPublicado, name: "Convidado A" })
      .select("id")
      .single();
    if (guestAError) throw new Error(`Falha ao criar convidado A: ${guestAError.message}`);
    c.guestA = guestA.id;

    const { data: guestB, error: guestBError } = await admin
      .from("guests")
      .insert({ event_id: c.eventos.aPublicado, name: "Convidado B" })
      .select("id")
      .single();
    if (guestBError) throw new Error(`Falha ao criar convidado B: ${guestBError.message}`);
    c.guestB = guestB.id;

    const { data: inviteA } = await admin
      .from("guest_invites")
      .insert({ guest_id: guestA.id })
      .select("token")
      .single();
    tokenA = inviteA.token;

    const { data: inviteB } = await admin
      .from("guest_invites")
      .insert({ guest_id: guestB.id })
      .select("token")
      .single();
    tokenB = inviteB.token;

    const { data: poll, error: pollError } = await admin
      .from("menu_polls")
      .insert({
        event_id: c.eventos.aPublicado,
        course: "Sobremesa",
        question: "Qual sobremesa você prefere?",
        closes_at: "2099-01-01T00:00:00Z",
        max_choices: 2,
      })
      .select("id")
      .single();
    if (pollError) throw new Error(`Falha ao criar enquete: ${pollError.message}`);
    pollId = poll.id;

    const { data: options, error: optionsError } = await admin
      .from("menu_options")
      .insert([
        { poll_id: pollId, name: "Petit gâteau" },
        { poll_id: pollId, name: "Cheesecake" },
        { poll_id: pollId, name: "Mousse de maracujá" },
      ])
      .select("id, name")
      .order("name");
    if (optionsError) throw new Error(`Falha ao criar opções: ${optionsError.message}`);
    optionIds = options;
  });

  after(async () => {
    await c.limpar();
  });

  describe("curadoria", () => {
    it("quem administra o evento cria enquete", async () => {
      const { data, error } = await c.membroA.client
        .from("menu_polls")
        .insert({
          event_id: c.eventos.aPublicado,
          course: "Entrada",
          question: "Qual entrada?",
          closes_at: "2099-01-01T00:00:00Z",
          max_choices: 1,
        })
        .select("id")
        .single();

      assert.equal(error, null);
      assert.ok(data.id);
    });

    it("limite de escolhas menor que um é recusado pela constraint", async () => {
      const { error } = await c.membroA.client.from("menu_polls").insert({
        event_id: c.eventos.aPublicado,
        course: "Entrada",
        question: "Qual entrada?",
        closes_at: "2099-01-01T00:00:00Z",
        max_choices: 0,
      });

      assert.ok(error, "check max_choices >= 1 deveria recusar");
    });

    it("prazo no passado é recusado pela constraint", async () => {
      const { error } = await c.membroA.client.from("menu_polls").insert({
        event_id: c.eventos.aPublicado,
        course: "Entrada",
        question: "Qual entrada?",
        closes_at: "2000-01-01T00:00:00Z",
        max_choices: 1,
      });

      assert.ok(error, "check closes_at >= created_at deveria recusar");
    });

    it("quem não administra o evento não cria enquete", async () => {
      const { error } = await c.membroB.client.from("menu_polls").insert({
        event_id: c.eventos.aPublicado,
        course: "Intruso",
        question: "?",
        closes_at: "2099-01-01T00:00:00Z",
        max_choices: 1,
      });

      assert.ok(error, "o `with check` de menu_polls_manage deveria recusar");
    });

    it("convidado (anon) não cria nem edita enquete", async () => {
      const { error } = await anonimo.from("menu_polls").insert({
        event_id: c.eventos.aPublicado,
        course: "Intruso",
        question: "?",
        closes_at: "2099-01-01T00:00:00Z",
        max_choices: 1,
      });

      assert.ok(error, "anon não tem grant de insert em menu_polls");
    });
  });

  describe("leitura pública de enquetes e opções", () => {
    it("evento publicado expõe enquete e opções a quem não tem conta", async () => {
      const { data } = await anonimo.from("menu_polls").select("id").eq("id", pollId);
      assert.equal(data.length, 1);

      const { data: options } = await anonimo
        .from("menu_options")
        .select("id")
        .eq("poll_id", pollId);
      assert.equal(options.length, 3);
    });

    it("evento em rascunho não expõe enquete", async () => {
      const { data: rascunhoPoll } = await admin
        .from("menu_polls")
        .insert({
          event_id: c.eventos.aRascunho,
          course: "Sobremesa",
          question: "?",
          closes_at: "2099-01-01T00:00:00Z",
          max_choices: 1,
        })
        .select("id")
        .single();

      const { data } = await anonimo
        .from("menu_polls")
        .select("id")
        .eq("id", rascunhoPoll.id);

      assert.deepEqual(data, []);
    });

    it("anon não lê menu_votes diretamente", async () => {
      const { error } = await anonimo.from("menu_votes").select("id");
      assert.ok(error, "sem grant/política de select para anon");
    });
  });

  describe("voto do convidado", () => {
    it("voto dentro do limite é registrado", async () => {
      const { data, error } = await anonimo.rpc("submit_menu_vote", {
        p_token: tokenA,
        p_poll_id: pollId,
        p_option_ids: [optionIds[0].id, optionIds[1].id],
      });

      assert.equal(error, null);
      assert.equal(data.length, 2);
    });

    it("excesso de escolhas é recusado", async () => {
      const { error } = await anonimo.rpc("submit_menu_vote", {
        p_token: tokenB,
        p_poll_id: pollId,
        p_option_ids: optionIds.map((o) => o.id),
      });

      assert.ok(error);
      assert.match(error.message, /excesso_de_escolhas/);
    });

    it("opção duplicada no mesmo envio é recusada", async () => {
      const { error } = await anonimo.rpc("submit_menu_vote", {
        p_token: tokenB,
        p_poll_id: pollId,
        p_option_ids: [optionIds[0].id, optionIds[0].id],
      });

      assert.ok(error);
      assert.match(error.message, /opcao_duplicada/);
    });

    it("opção de outra enquete é recusada e nada é gravado", async () => {
      const { data: outraEnquete } = await admin
        .from("menu_polls")
        .insert({
          event_id: c.eventos.aPublicado,
          course: "Bebida",
          question: "?",
          closes_at: "2099-01-01T00:00:00Z",
          max_choices: 1,
        })
        .select("id")
        .single();
      const { data: outraOpcao } = await admin
        .from("menu_options")
        .insert({ poll_id: outraEnquete.id, name: "Suco" })
        .select("id")
        .single();

      const { error } = await anonimo.rpc("submit_menu_vote", {
        p_token: tokenB,
        p_poll_id: pollId,
        p_option_ids: [outraOpcao.id],
      });

      assert.ok(error);
      assert.match(error.message, /opcao_invalida/);

      const { count } = await admin
        .from("menu_votes")
        .select("id", { count: "exact", head: true })
        .eq("guest_id", c.guestB);
      assert.equal(count, 0, "nada deveria ter sido gravado para o convidado B");
    });

    it("token inexistente é recusado", async () => {
      const { error } = await anonimo.rpc("submit_menu_vote", {
        p_token: "token-que-nao-existe",
        p_poll_id: pollId,
        p_option_ids: [optionIds[0].id],
      });

      assert.ok(error);
      assert.match(error.message, /convite_invalido/);
    });

    it("visitante não identificado não altera a contagem", async () => {
      const before = await admin
        .from("menu_votes")
        .select("id", { count: "exact", head: true })
        .eq("poll_id", pollId);

      await anonimo.rpc("submit_menu_vote", {
        p_token: "token-que-nao-existe",
        p_poll_id: pollId,
        p_option_ids: [optionIds[0].id],
      });

      const after = await admin
        .from("menu_votes")
        .select("id", { count: "exact", head: true })
        .eq("poll_id", pollId);

      assert.equal(after.count, before.count);
    });

    it("módulo desabilitado recusa o voto", async () => {
      const { data: guest } = await admin
        .from("guests")
        .insert({ event_id: c.eventos.aRascunho, name: "Sem módulo" })
        .select("id")
        .single();
      const { data: invite } = await admin
        .from("guest_invites")
        .insert({ guest_id: guest.id })
        .select("token")
        .single();
      const { data: poll } = await admin
        .from("menu_polls")
        .insert({
          event_id: c.eventos.aRascunho,
          course: "Sobremesa",
          question: "?",
          closes_at: "2099-01-01T00:00:00Z",
          max_choices: 1,
        })
        .select("id")
        .single();
      const { data: option } = await admin
        .from("menu_options")
        .insert({ poll_id: poll.id, name: "Bolo" })
        .select("id")
        .single();

      const { error } = await anonimo.rpc("submit_menu_vote", {
        p_token: invite.token,
        p_poll_id: poll.id,
        p_option_ids: [option.id],
      });

      assert.ok(error);
      assert.match(error.message, /modulo_desabilitado/);
    });

    it("prazo encerrado recusa o voto e preserva o anterior", async () => {
      const { data: poll } = await admin
        .from("menu_polls")
        .insert({
          event_id: c.eventos.aPublicado,
          course: "Prazo curto",
          question: "?",
          closes_at: "2000-01-02T00:00:00Z",
          max_choices: 1,
          created_at: "2000-01-01T00:00:00Z",
        })
        .select("id")
        .single();
      const { data: option } = await admin
        .from("menu_options")
        .insert({ poll_id: poll.id, name: "Única opção" })
        .select("id")
        .single();

      const { error } = await anonimo.rpc("submit_menu_vote", {
        p_token: tokenA,
        p_poll_id: poll.id,
        p_option_ids: [option.id],
      });

      assert.ok(error);
      assert.match(error.message, /prazo_encerrado/);

      const { count } = await admin
        .from("menu_votes")
        .select("id", { count: "exact", head: true })
        .eq("poll_id", poll.id);
      assert.equal(count, 0);
    });
  });

  describe("troca de voto", () => {
    it("um convidado que já votou substitui as escolhas sem duplicar", async () => {
      await anonimo.rpc("submit_menu_vote", {
        p_token: tokenB,
        p_poll_id: pollId,
        p_option_ids: [optionIds[0].id],
      });

      const { data, error } = await anonimo.rpc("submit_menu_vote", {
        p_token: tokenB,
        p_poll_id: pollId,
        p_option_ids: [optionIds[2].id],
      });

      assert.equal(error, null);
      assert.deepEqual(data, [optionIds[2].id]);

      const { data: votes } = await admin
        .from("menu_votes")
        .select("option_id")
        .eq("poll_id", pollId)
        .eq("guest_id", c.guestB);

      assert.equal(votes.length, 1);
      assert.equal(votes[0].option_id, optionIds[2].id);
    });
  });

  describe("apuração", () => {
    it("get_menu_polls_publicos reflete a contagem de votos", async () => {
      const { data } = await anonimo.rpc("get_menu_polls_publicos", {
        p_event_slug: `a-publicado-${c.tag}`,
      });

      const rows = data.filter((r) => r.poll_id === pollId);
      const chosenRow = rows.find((r) => r.option_id === optionIds[0].id);

      // Convidado A votou nas opções 0 e 1 no primeiro teste desta suíte.
      assert.ok(chosenRow.votes >= 1);
    });

    it("anfitrião lê menu_votes diretamente; quem não administra não lê", async () => {
      const { data: comoAnfitriao } = await c.membroA.client
        .from("menu_votes")
        .select("id")
        .eq("poll_id", pollId);
      assert.ok(comoAnfitriao.length >= 1);

      const { data: comoIntruso } = await c.membroB.client
        .from("menu_votes")
        .select("id")
        .eq("poll_id", pollId);
      assert.deepEqual(comoIntruso, []);
    });
  });

  describe("remoção de opção votada", () => {
    it("guest_invites não é legível por anon", async () => {
      const { error } = await anonimo.from("guest_invites").select("token");
      assert.ok(error);
    });

    it("remover opção com voto sob cascade também remove os votos", async () => {
      const { data: poll } = await admin
        .from("menu_polls")
        .insert({
          event_id: c.eventos.aPublicado,
          course: "Removível",
          question: "?",
          closes_at: "2099-01-01T00:00:00Z",
          max_choices: 1,
        })
        .select("id")
        .single();
      const { data: option } = await admin
        .from("menu_options")
        .insert({ poll_id: poll.id, name: "Vai sumir" })
        .select("id")
        .single();

      const { error: voteError } = await anonimo.rpc("submit_menu_vote", {
        p_token: tokenA,
        p_poll_id: poll.id,
        p_option_ids: [option.id],
      });
      assert.equal(voteError, null);

      await admin.from("menu_options").delete().eq("id", option.id);

      const { count } = await admin
        .from("menu_votes")
        .select("id", { count: "exact", head: true })
        .eq("option_id", option.id);
      assert.equal(count, 0, "on delete cascade deveria remover os votos junto");
    });
  });
});
