import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { admin, anonimo, montarCenario } from "./harness.mjs";

/**
 * Cenários da spec `amigo-secreto` de `add-secret-santa-backend`, contra o
 * banco local: adesão, wishlist, restrições, sorteio (derangement +
 * exclusões, atomicidade, concorrência), sigilo dos pares e revelação.
 *
 * Pré-requisito: `npm run db:start`.
 */
describe("amigo secreto", () => {
  let c;

  before(async () => {
    c = await montarCenario();
    await admin
      .from("event_modules")
      .insert({ event_id: c.eventos.aPublicado, module: "amigo-secreto" });
  });

  after(async () => {
    await c.limpar();
  });

  /** Cria convidado + convite num evento, devolve o token. */
  async function criarConvidado(eventId, name) {
    const { data: guest, error } = await admin
      .from("guests")
      .insert({ event_id: eventId, name })
      .select("id")
      .single();
    if (error) throw new Error(`Falha ao criar convidado: ${error.message}`);

    const { data: invite } = await admin
      .from("guest_invites")
      .insert({ guest_id: guest.id })
      .select("token")
      .single();

    return { guestId: guest.id, token: invite.token };
  }

  /** Adere ao amigo secreto via RPC (caminho real do convidado). */
  async function aderir(token, displayName) {
    return anonimo.rpc("join_secret_santa", { p_token: token, p_display_name: displayName });
  }

  describe("adesão de participante", () => {
    it("participante cadastrado com sucesso", async () => {
      const { token } = await criarConvidado(c.eventos.aPublicado, "Convidado Adesão 1");
      const { data, error } = await aderir(token, "Fulano");

      assert.equal(error, null);
      assert.ok(data.joined_at);
    });

    it("nome duplicado é recusado", async () => {
      const { token } = await criarConvidado(c.eventos.aPublicado, "Convidado Adesão 2");
      const { error } = await aderir(token, "fulano"); // mesmo nome, outra caixa

      assert.ok(error);
      assert.match(error.message, /nome_duplicado/);
    });

    it("módulo desabilitado recusa adesão", async () => {
      const { token } = await criarConvidado(c.eventos.aRascunho, "Sem módulo");
      const { error } = await aderir(token, "Alguém");

      assert.ok(error);
      assert.match(error.message, /modulo_desabilitado/);
    });

    it("token inexistente é recusado", async () => {
      const { error } = await aderir("token-que-nao-existe", "Ninguém");

      assert.ok(error);
      assert.match(error.message, /convite_invalido/);
    });
  });

  describe("lista de desejos", () => {
    it("participante identificado atualiza a wishlist e ela reflete no prefill", async () => {
      const { token } = await criarConvidado(c.eventos.aPublicado, "Convidado Wishlist");
      await aderir(token, "Ciclana");

      const { error: updateError } = await anonimo.rpc("update_secret_santa_wishlist", {
        p_token: token,
        p_wishlist: ["Vela", "Livro"],
      });
      assert.equal(updateError, null);

      const { data } = await anonimo.rpc("get_my_secret_santa_participation", { p_token: token });
      assert.deepEqual(data[0].wishlist, ["Vela", "Livro"]);
    });

    it("visitante não lê wishlist de ninguém diretamente", async () => {
      const { error } = await anonimo.from("secret_santa_wishlists").select("items");
      assert.ok(error, "sem grant/política de select para anon/authenticated");
    });
  });

  describe("restrições de par", () => {
    it("quem administra cadastra restrição; quem não administra é recusado", async () => {
      const { token: tokenA } = await criarConvidado(c.eventos.aPublicado, "Exclusão A");
      const { token: tokenB } = await criarConvidado(c.eventos.aPublicado, "Exclusão B");
      const { data: pa } = await aderir(tokenA, "Exclusão Um");
      const { data: pb } = await aderir(tokenB, "Exclusão Dois");

      const { error: forbidden } = await c.membroB.client.rpc("add_secret_santa_exclusion", {
        p_event_id: c.eventos.aPublicado,
        p_participant_a: pa.id,
        p_participant_b: pb.id,
      });
      assert.ok(forbidden);

      const { error } = await c.membroA.client.rpc("add_secret_santa_exclusion", {
        p_event_id: c.eventos.aPublicado,
        p_participant_a: pa.id,
        p_participant_b: pb.id,
      });
      assert.equal(error, null);
    });
  });

  describe("sorteio", () => {
    /** Monta um evento publicado próprio, com N participantes já aderidos. */
    async function montarEventoComParticipantes(n, tagSuffix) {
      const { data: evento, error } = await admin
        .from("events")
        .insert({
          slug: `sorteio-${tagSuffix}-${c.tag}`,
          organization_id: c.orgA,
          host_profile_id: c.membroA.id,
          kind: "casamento",
          title: `Evento sorteio ${tagSuffix}`,
          event_at: "2027-01-01T18:00:00-03:00",
          status: "publicado",
        })
        .select("id")
        .single();
      if (error) throw new Error(`Falha ao criar evento: ${error.message}`);

      await admin.from("event_modules").insert({ event_id: evento.id, module: "amigo-secreto" });

      const participantes = [];
      for (let i = 0; i < n; i++) {
        const { token } = await criarConvidado(evento.id, `Sorteio ${tagSuffix} ${i}`);
        const { data } = await aderir(token, `Participante ${tagSuffix} ${i}`);
        participantes.push({ id: data.id, token });
      }

      return { eventoId: evento.id, participantes };
    }

    it("participantes insuficientes recusa o sorteio", async () => {
      const { eventoId } = await montarEventoComParticipantes(2, "poucos");

      const { error } = await c.membroA.client.rpc("run_secret_santa_draw", {
        p_event_id: eventoId,
      });

      assert.ok(error);
      assert.match(error.message, /participantes_insuficientes/);
    });

    it("gera um derangement válido, respeitando exclusão, e recusa segunda execução", async () => {
      const { eventoId, participantes } = await montarEventoComParticipantes(4, "valido");

      const { error: exclusionError } = await c.membroA.client.rpc("add_secret_santa_exclusion", {
        p_event_id: eventoId,
        p_participant_a: participantes[0].id,
        p_participant_b: participantes[1].id,
      });
      assert.equal(exclusionError, null);

      const { error } = await c.membroA.client.rpc("run_secret_santa_draw", {
        p_event_id: eventoId,
      });
      assert.equal(error, null);

      const { data: draw } = await admin
        .from("secret_santa_draws")
        .select("id")
        .eq("event_id", eventoId)
        .single();

      const { data: assignments } = await admin
        .from("secret_santa_assignments")
        .select("giver_participant_id, receiver_participant_id")
        .eq("draw_id", draw.id);

      assert.equal(assignments.length, 4, "cada participante deve ter exatamente um par");

      const givers = new Set(assignments.map((a) => a.giver_participant_id));
      const receivers = new Set(assignments.map((a) => a.receiver_participant_id));
      assert.equal(givers.size, 4);
      assert.equal(receivers.size, 4, "cada pessoa é sorteada exatamente uma vez");

      for (const a of assignments) {
        assert.notEqual(a.giver_participant_id, a.receiver_participant_id, "ninguém tira a si mesmo");
      }

      const exclusaoViolada = assignments.some(
        (a) =>
          (a.giver_participant_id === participantes[0].id &&
            a.receiver_participant_id === participantes[1].id) ||
          (a.giver_participant_id === participantes[1].id &&
            a.receiver_participant_id === participantes[0].id),
      );
      assert.equal(exclusaoViolada, false, "a restrição de par deveria ter sido respeitada");

      const { error: segundaExecucao } = await c.membroA.client.rpc("run_secret_santa_draw", {
        p_event_id: eventoId,
      });
      assert.ok(segundaExecucao);
      assert.match(segundaExecucao.message, /sorteio_ja_realizado/);
    });

    it("restrições sem solução falham sem gravar nada", async () => {
      const { eventoId, participantes } = await montarEventoComParticipantes(3, "impossivel");

      // As 3 exclusões possíveis entre 3 participantes tornam qualquer
      // derangement de 3 elementos impossível: um derangement de 3 é sempre
      // um dos dois 3-ciclos, e cada um usa todos os 3 pares.
      const pares = [
        [0, 1],
        [1, 2],
        [0, 2],
      ];
      for (const [i, j] of pares) {
        const { error } = await c.membroA.client.rpc("add_secret_santa_exclusion", {
          p_event_id: eventoId,
          p_participant_a: participantes[i].id,
          p_participant_b: participantes[j].id,
        });
        assert.equal(error, null);
      }

      const { error } = await c.membroA.client.rpc("run_secret_santa_draw", {
        p_event_id: eventoId,
      });

      assert.ok(error);
      assert.match(error.message, /sorteio_impossivel/);

      const { count } = await admin
        .from("secret_santa_draws")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventoId);
      assert.equal(count, 0, "nenhum sorteio deveria ter sido gravado");
    });

    it("quem não administra não dispara o sorteio", async () => {
      const { eventoId } = await montarEventoComParticipantes(3, "semperm");

      const { error } = await c.membroB.client.rpc("run_secret_santa_draw", {
        p_event_id: eventoId,
      });

      assert.ok(error);
      assert.match(error.message, /sem_permissao/);
    });

    it("execuções concorrentes: só uma produz o resultado", async () => {
      const { eventoId } = await montarEventoComParticipantes(4, "concorrente");

      const [r1, r2] = await Promise.all([
        c.membroA.client.rpc("run_secret_santa_draw", { p_event_id: eventoId }),
        c.membroA.client.rpc("run_secret_santa_draw", { p_event_id: eventoId }),
      ]);

      const erros = [r1.error, r2.error].filter(Boolean);
      const sucessos = [r1.error, r2.error].filter((e) => !e);

      assert.equal(sucessos.length, 1, "exatamente uma chamada deveria ter sucesso");
      assert.equal(erros.length, 1);
      assert.match(erros[0].message, /sorteio_ja_realizado/);

      const { count } = await admin
        .from("secret_santa_draws")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventoId);
      assert.equal(count, 1, "só um sorteio deveria existir");
    });
  });

  describe("sigilo dos pares e revelação", () => {
    it("ninguém lê secret_santa_assignments/secret_santa_reveals diretamente", async () => {
      const { error: comoAnon } = await anonimo.from("secret_santa_assignments").select("id");
      assert.ok(comoAnon);

      const { error: comoAnfitriao } = await c.membroA.client
        .from("secret_santa_assignments")
        .select("id");
      assert.ok(comoAnfitriao, "nem quem administra o evento deveria ler um par direto da tabela");

      const { error: reveals } = await c.membroA.client.from("secret_santa_reveals").select("*");
      assert.ok(reveals);
    });

    it("participante só vê o próprio par; anfitrião só vê contagem e se sorteou", async () => {
      const { data: evento } = await admin
        .from("events")
        .insert({
          slug: `revelacao-${c.tag}`,
          organization_id: c.orgA,
          host_profile_id: c.membroA.id,
          kind: "casamento",
          title: "Evento revelação",
          event_at: "2027-01-01T18:00:00-03:00",
          status: "publicado",
        })
        .select("id")
        .single();
      await admin.from("event_modules").insert({ event_id: evento.id, module: "amigo-secreto" });

      const tokens = [];
      for (let i = 0; i < 3; i++) {
        const { token } = await criarConvidado(evento.id, `Revelação ${i}`);
        await aderir(token, `Revelação Participante ${i}`);
        tokens.push(token);
      }

      const { data: statusAntesData, error: statusAntesError } = await c.membroA.client.rpc(
        "get_secret_santa_status",
        { p_event_id: evento.id },
      );
      assert.equal(statusAntesError, null);
      assert.equal(statusAntesData[0].participant_count, 3);
      assert.equal(statusAntesData[0].drawn_at, null);

      const { error: statusSemPermissao } = await c.membroB.client.rpc(
        "get_secret_santa_status",
        { p_event_id: evento.id },
      );
      assert.ok(statusSemPermissao);
      assert.match(statusSemPermissao.message, /sem_permissao/);

      const { error: drawError } = await c.membroA.client.rpc("run_secret_santa_draw", {
        p_event_id: evento.id,
      });
      assert.equal(drawError, null);

      const { data: statusDepois } = await c.membroA.client.rpc("get_secret_santa_status", {
        p_event_id: evento.id,
      });
      assert.ok(statusDepois[0].drawn_at, "status deveria refletir que o sorteio ocorreu");

      const { data: reveal1 } = await anonimo.rpc("get_my_secret_santa", {
        p_token: tokens[0],
      });
      assert.equal(reveal1[0].drawn, true);
      assert.ok(reveal1[0].receiver_name);
      assert.notEqual(reveal1[0].receiver_name, `Revelação Participante 0`);

      // Segunda consulta devolve o mesmo par — revelação persiste.
      const { data: reveal1Again } = await anonimo.rpc("get_my_secret_santa", {
        p_token: tokens[0],
      });
      assert.equal(reveal1Again[0].receiver_name, reveal1[0].receiver_name);
      assert.equal(reveal1Again[0].revealed_at, reveal1[0].revealed_at);

      // Refazer depois de uma revelação é recusado.
      const { error: redoError } = await c.membroA.client.rpc("redo_secret_santa_draw", {
        p_event_id: evento.id,
      });
      assert.ok(redoError);
      assert.match(redoError.message, /ja_revelado_recusa/);
    });

    it("revelação antes do sorteio devolve estado não sorteado", async () => {
      const { data: evento } = await admin
        .from("events")
        .insert({
          slug: `nao-sorteado-${c.tag}`,
          organization_id: c.orgA,
          host_profile_id: c.membroA.id,
          kind: "casamento",
          title: "Evento não sorteado",
          event_at: "2027-01-01T18:00:00-03:00",
          status: "publicado",
        })
        .select("id")
        .single();
      await admin.from("event_modules").insert({ event_id: evento.id, module: "amigo-secreto" });

      const { token } = await criarConvidado(evento.id, "Ainda não sorteou");
      await aderir(token, "Ainda Não Sorteou");

      const { data } = await anonimo.rpc("get_my_secret_santa", { p_token: token });
      assert.equal(data[0].drawn, false);
      assert.equal(data[0].receiver_name, null);
    });

    it("refazer sorteio antes de qualquer revelação substitui os pares", async () => {
      const { data: evento } = await admin
        .from("events")
        .insert({
          slug: `refazer-${c.tag}`,
          organization_id: c.orgA,
          host_profile_id: c.membroA.id,
          kind: "casamento",
          title: "Evento refazer",
          event_at: "2027-01-01T18:00:00-03:00",
          status: "publicado",
        })
        .select("id")
        .single();
      await admin.from("event_modules").insert({ event_id: evento.id, module: "amigo-secreto" });

      for (let i = 0; i < 3; i++) {
        const { token } = await criarConvidado(evento.id, `Refazer ${i}`);
        await aderir(token, `Refazer Participante ${i}`);
      }

      await c.membroA.client.rpc("run_secret_santa_draw", { p_event_id: evento.id });
      const { data: drawAntes } = await admin
        .from("secret_santa_draws")
        .select("id")
        .eq("event_id", evento.id)
        .single();

      const { error } = await c.membroA.client.rpc("redo_secret_santa_draw", {
        p_event_id: evento.id,
      });
      assert.equal(error, null);

      const { data: drawDepois } = await admin
        .from("secret_santa_draws")
        .select("id")
        .eq("event_id", evento.id)
        .single();

      assert.notEqual(drawDepois.id, drawAntes.id, "o sorteio deveria ter sido substituído");
    });
  });
});
