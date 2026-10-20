import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { admin, anonimo, montarCenario } from "./harness.mjs";

/**
 * Cenários da spec `sorteios` de `add-raffles`, contra o banco local:
 * autorização, bloqueio de inscrições ao começar, ordem das vagas, ninguém
 * sorteado duas vezes, ausente e recomeçar.
 *
 * Pré-requisito: `npm run db:start`.
 */
describe("sorteios", () => {
  let c;

  before(async () => {
    c = await montarCenario();
    await admin.from("event_modules").insert([
      { event_id: c.eventos.aPublicado, module: "sorteios" },
      { event_id: c.eventos.aRascunho, module: "sorteios" },
    ]);
  });

  after(async () => {
    await c.limpar();
  });

  async function criarConvidados(eventId, quantos, prefixo) {
    const { data, error } = await admin
      .from("guests")
      .insert(Array.from({ length: quantos }, (_, i) => ({ event_id: eventId, name: `${prefixo} ${i + 1}` })))
      .select("id, name");
    if (error) throw new Error(`Falha ao criar convidados: ${error.message}`);
    return data;
  }

  /** Sorteio montado pela anfitriã A, com os prêmios e convidados dados. */
  async function montarSorteio(eventId, { premios, convidados, suplentes = 0 }) {
    const anfitria = c.membroA.client;
    const { data: raffle, error } = await anfitria
      .from("raffles")
      .insert({ event_id: eventId, title: "Sorteio de teste", alternates_count: suplentes })
      .select("id")
      .single();
    if (error) throw new Error(`Falha ao criar sorteio: ${error.message}`);

    const { data: prizes, error: prizeError } = await anfitria
      .from("raffle_prizes")
      .insert(
        premios.map((p, i) => ({
          raffle_id: raffle.id,
          event_id: eventId,
          name: p.name,
          quantity: p.quantity ?? 1,
          position: i,
        })),
      )
      .select("id, name");
    if (prizeError) throw new Error(`Falha ao criar prêmios: ${prizeError.message}`);

    if (convidados.length > 0) {
      const { error: partError } = await anfitria.from("raffle_participants").insert(
        convidados.map((g) => ({
          raffle_id: raffle.id,
          event_id: eventId,
          guest_id: g.id,
          display_name: g.name,
        })),
      );
      if (partError) throw new Error(`Falha ao incluir participantes: ${partError.message}`);
    }

    return { raffleId: raffle.id, prizes };
  }

  describe("autorização", () => {
    it("anfitriã de outro evento não vê nem cria sorteios", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 3, "Autz");
      const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio" }],
        convidados,
      });

      const { data } = await c.membroB.client.from("raffles").select("id").eq("id", raffleId);
      assert.deepEqual(data, []);

      const { error } = await c.membroB.client
        .from("raffles")
        .insert({ event_id: c.eventos.aPublicado, title: "Intruso" });
      assert.ok(error, "insert de outro anfitrião deveria ser recusado");
    });

    it("convidado sem conta não lê sorteios nem sorteia", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 3, "Anon");
      const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio" }],
        convidados,
      });

      const { data } = await anonimo.from("raffle_participants").select("id").eq("raffle_id", raffleId);
      assert.ok(!data || data.length === 0);

      const { error } = await anonimo.rpc("draw_raffle_winner", { p_raffle_id: raffleId });
      assert.ok(error);
    });

    it("anfitriã de outro evento não sorteia", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 3, "OutroSort");
      const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio" }],
        convidados,
      });

      const { error } = await c.membroB.client.rpc("start_raffle", { p_raffle_id: raffleId });
      assert.equal(error?.message, "sorteio_nao_encontrado");
    });

    it("anfitriã não grava resultado diretamente", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 2, "Direto");
      const { raffleId, prizes } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio" }],
        convidados,
      });
      const { data: part } = await admin
        .from("raffle_participants")
        .select("id")
        .eq("raffle_id", raffleId)
        .limit(1)
        .single();

      const { error } = await c.membroA.client.from("raffle_results").insert({
        raffle_id: raffleId,
        event_id: c.eventos.aPublicado,
        participant_id: part.id,
        prize_id: prizes[0].id,
        sequence: 1,
      });
      assert.ok(error, "resultado só pode nascer de draw_raffle_winner");
    });

    it("participante precisa ser convidado do mesmo evento", async () => {
      const [deOutroEvento] = await criarConvidados(c.eventos.bRascunho, 1, "Estranho");
      const convidados = await criarConvidados(c.eventos.aPublicado, 1, "Local");
      const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio" }],
        convidados,
      });

      const { error } = await admin.from("raffle_participants").insert({
        raffle_id: raffleId,
        event_id: c.eventos.aPublicado,
        guest_id: deOutroEvento.id,
        display_name: deOutroEvento.name,
      });
      assert.equal(error?.message, "participante_invalido");
    });
  });

  describe("bloqueio ao começar", () => {
    it("começar bloqueia inclusão e remoção de participantes e prêmios", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 4, "Bloq");
      const { raffleId, prizes } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio" }],
        convidados: convidados.slice(0, 3),
      });
      const anfitria = c.membroA.client;

      const { data: started, error } = await anfitria.rpc("start_raffle", { p_raffle_id: raffleId });
      assert.equal(error, null);
      assert.equal(started.status, "em_andamento");

      const { error: addError } = await anfitria.from("raffle_participants").insert({
        raffle_id: raffleId,
        event_id: c.eventos.aPublicado,
        guest_id: convidados[3].id,
        display_name: convidados[3].name,
      });
      assert.equal(addError?.message, "sorteio_bloqueado");

      const { error: delError } = await anfitria
        .from("raffle_participants")
        .delete()
        .eq("raffle_id", raffleId);
      assert.equal(delError?.message, "sorteio_bloqueado");

      const { error: prizeError } = await anfitria
        .from("raffle_prizes")
        .update({ quantity: 5 })
        .eq("id", prizes[0].id);
      assert.equal(prizeError?.message, "sorteio_bloqueado");

      const { error: altError } = await anfitria
        .from("raffles")
        .update({ alternates_count: 3 })
        .eq("id", raffleId);
      assert.equal(altError?.message, "sorteio_bloqueado");
    });

    it("status não muda por update direto", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 2, "Status");
      const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio" }],
        convidados,
      });

      const { error } = await c.membroA.client
        .from("raffles")
        .update({ status: "encerrado" })
        .eq("id", raffleId);
      assert.ok(error, "status só muda pelas funções");
    });

    it("não começa sem prêmio ou sem participante", async () => {
      const { data: vazio } = await c.membroA.client
        .from("raffles")
        .insert({ event_id: c.eventos.aPublicado, title: "Vazio" })
        .select("id")
        .single();
      const { error } = await c.membroA.client.rpc("start_raffle", { p_raffle_id: vazio.id });
      assert.equal(error?.message, "sem_premios");
    });

    it("reabrir só antes do primeiro nome sorteado", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 3, "Reabre");
      const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio", quantity: 2 }],
        convidados,
      });
      const anfitria = c.membroA.client;

      await anfitria.rpc("start_raffle", { p_raffle_id: raffleId });
      const { data: reaberto, error } = await anfitria.rpc("reopen_raffle", { p_raffle_id: raffleId });
      assert.equal(error, null);
      assert.equal(reaberto.status, "aberto");

      await anfitria.rpc("start_raffle", { p_raffle_id: raffleId });
      await anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId });
      const { error: recusa } = await anfitria.rpc("reopen_raffle", { p_raffle_id: raffleId });
      assert.equal(recusa?.message, "sorteio_com_resultados");
    });
  });

  describe("sorteio", () => {
    it("preenche as vagas na ordem dos prêmios, depois suplentes, e encerra", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 6, "Ordem");
      const { raffleId, prizes } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Primeiro", quantity: 2 }, { name: "Segundo" }],
        convidados,
        suplentes: 1,
      });
      const anfitria = c.membroA.client;

      const { error: notStarted } = await anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId });
      assert.equal(notStarted?.message, "sorteio_nao_iniciado");

      await anfitria.rpc("start_raffle", { p_raffle_id: raffleId });

      const sorteados = [];
      for (let i = 0; i < 4; i++) {
        const { data, error } = await anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId });
        assert.equal(error, null);
        sorteados.push(data[0]);
      }

      assert.deepEqual(
        sorteados.map((s) => s.prize_id),
        [prizes[0].id, prizes[0].id, prizes[1].id, null],
      );
      assert.deepEqual(
        sorteados.map((s) => s.remaining),
        [3, 2, 1, 0],
      );
      assert.equal(new Set(sorteados.map((s) => s.participant_id)).size, 4, "ninguém sai duas vezes");

      const { data: raffle } = await admin.from("raffles").select("status").eq("id", raffleId).single();
      assert.equal(raffle.status, "encerrado");

      const { error: concluido } = await anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId });
      assert.equal(concluido?.message, "sorteio_concluido");
    });

    it("sorteios concorrentes não repetem vaga nem pessoa", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 8, "Conc");
      const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio", quantity: 4 }],
        convidados,
      });
      const anfitria = c.membroA.client;
      await anfitria.rpc("start_raffle", { p_raffle_id: raffleId });

      const respostas = await Promise.all(
        Array.from({ length: 6 }, () => anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId })),
      );
      const ok = respostas.filter((r) => !r.error);
      assert.equal(ok.length, 4);
      assert.equal(new Set(ok.map((r) => r.data[0].participant_id)).size, 4);
      assert.deepEqual(
        ok.map((r) => r.data[0].sequence).sort((a, b) => a - b),
        [1, 2, 3, 4],
      );
    });

    it("urna esgotada antes das vagas recusa o próximo sorteio", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 1, "Esgota");
      const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio", quantity: 3 }],
        convidados,
      });
      const anfitria = c.membroA.client;
      await anfitria.rpc("start_raffle", { p_raffle_id: raffleId });
      await anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId });

      const { error } = await anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId });
      assert.equal(error?.message, "participantes_esgotados");

      const { data: encerrado, error: finishError } = await anfitria.rpc("finish_raffle", {
        p_raffle_id: raffleId,
      });
      assert.equal(finishError, null);
      assert.equal(encerrado.status, "encerrado");
    });

    it("ausente libera a vaga e não volta para a urna", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 3, "Ausente");
      const { raffleId, prizes } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Único" }],
        convidados,
      });
      const anfitria = c.membroA.client;
      await anfitria.rpc("start_raffle", { p_raffle_id: raffleId });

      const { data: primeiro } = await anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId });
      const { data: fechado } = await admin.from("raffles").select("status").eq("id", raffleId).single();
      assert.equal(fechado.status, "encerrado");

      const { error } = await anfitria.rpc("mark_raffle_result_absent", {
        p_result_id: primeiro[0].result_id,
      });
      assert.equal(error, null);

      const { data: reaberto } = await admin.from("raffles").select("status").eq("id", raffleId).single();
      assert.equal(reaberto.status, "em_andamento");

      const { data: segundo } = await anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId });
      assert.equal(segundo[0].prize_id, prizes[0].id);
      assert.notEqual(segundo[0].participant_id, primeiro[0].participant_id);
    });

    it("recomeçar descarta resultados e reabre", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 3, "Recomeca");
      const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio", quantity: 2 }],
        convidados,
      });
      const anfitria = c.membroA.client;
      await anfitria.rpc("start_raffle", { p_raffle_id: raffleId });
      await anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId });

      const { data: reset, error } = await anfitria.rpc("reset_raffle", { p_raffle_id: raffleId });
      assert.equal(error, null);
      assert.equal(reset.status, "aberto");

      const { count } = await admin
        .from("raffle_results")
        .select("id", { count: "exact", head: true })
        .eq("raffle_id", raffleId);
      assert.equal(count, 0);
    });

    it("módulo desligado recusa o sorteio", async () => {
      const convidados = await criarConvidados(c.eventos.aRascunho, 2, "Modulo");
      const { raffleId } = await montarSorteio(c.eventos.aRascunho, {
        premios: [{ name: "Prêmio" }],
        convidados,
      });
      await admin
        .from("event_modules")
        .delete()
        .eq("event_id", c.eventos.aRascunho)
        .eq("module", "sorteios");

      const { error } = await c.membroA.client.rpc("start_raffle", { p_raffle_id: raffleId });
      assert.equal(error?.message, "modulo_desabilitado");
    });
  });

  describe("modo de participação", () => {
    /** Sorteio vazio de participantes, num modo automático. */
    async function sorteioAutomatico(eventId, modo) {
      const { raffleId } = await montarSorteio(eventId, { premios: [{ name: "Prêmio" }], convidados: [] });
      const { error } = await c.membroA.client
        .from("raffles")
        .update({ participant_mode: modo })
        .eq("id", raffleId);
      if (error) throw new Error(`Falha ao mudar o modo: ${error.message}`);
      return raffleId;
    }

    async function participantesDe(raffleId) {
      const { data } = await admin
        .from("raffle_participants")
        .select("guest_id")
        .eq("raffle_id", raffleId);
      return new Set(data.map((p) => p.guest_id));
    }

    it("todos: quem foi cadastrado até começar entra na urna", async () => {
      const { data: evento } = await admin
        .from("events")
        .insert({
          slug: `todos-${c.tag}`,
          host_profile_id: c.membroA.id,
          kind: "casamento",
          title: "Evento todos",
          event_at: "2027-01-01T18:00:00-03:00",
          status: "rascunho",
        })
        .select("id")
        .single();
      await admin.from("event_modules").insert({ event_id: evento.id, module: "sorteios" });

      try {
        const antes = await criarConvidados(evento.id, 2, "Antes");
        const raffleId = await sorteioAutomatico(evento.id, "todos");
        const depois = await criarConvidados(evento.id, 2, "Depois");
        await admin.from("guests").update({ status: "recusado" }).eq("id", depois[1].id);

        const { data, error } = await c.membroA.client.rpc("start_raffle", { p_raffle_id: raffleId });
        assert.equal(error, null);
        assert.equal(data.status, "em_andamento");

        const ids = await participantesDe(raffleId);
        assert.deepEqual(ids, new Set([...antes, ...depois].map((g) => g.id)));

        // Depois de começar, convidado novo não entra.
        const [tarde] = await criarConvidados(evento.id, 1, "Tarde");
        assert.ok(!(await participantesDe(raffleId)).has(tarde.id));
      } finally {
        await admin.from("events").delete().eq("id", evento.id);
      }
    });

    it("confirmados: só quem confirmou presença entra", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 3, "Conf");
      await admin
        .from("guests")
        .update({ status: "confirmado" })
        .in("id", [convidados[0].id, convidados[1].id]);

      const raffleId = await sorteioAutomatico(c.eventos.aPublicado, "confirmados");
      const { error } = await c.membroA.client.rpc("start_raffle", { p_raffle_id: raffleId });
      assert.equal(error, null);

      const ids = await participantesDe(raffleId);
      assert.ok(ids.has(convidados[0].id));
      assert.ok(ids.has(convidados[1].id));
      assert.ok(!ids.has(convidados[2].id));
      for (const id of ids) {
        const { data: g } = await admin.from("guests").select("status").eq("id", id).single();
        assert.equal(g.status, "confirmado");
      }
    });

    it("sem convidado elegível, não começa", async () => {
      const { data: evento } = await admin
        .from("events")
        .insert({
          slug: `vazio-${c.tag}`,
          host_profile_id: c.membroA.id,
          kind: "casamento",
          title: "Evento vazio",
          event_at: "2027-01-01T18:00:00-03:00",
          status: "rascunho",
        })
        .select("id")
        .single();
      await admin.from("event_modules").insert({ event_id: evento.id, module: "sorteios" });

      try {
        await criarConvidados(evento.id, 2, "Pendente");
        const raffleId = await sorteioAutomatico(evento.id, "confirmados");
        const { error } = await c.membroA.client.rpc("start_raffle", { p_raffle_id: raffleId });
        assert.equal(error?.message, "sem_convidados_elegiveis");
      } finally {
        await admin.from("events").delete().eq("id", evento.id);
      }
    });

    it("modo não muda depois de começar", async () => {
      const convidados = await criarConvidados(c.eventos.aPublicado, 2, "ModoTrava");
      const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
        premios: [{ name: "Prêmio" }],
        convidados,
      });
      await c.membroA.client.rpc("start_raffle", { p_raffle_id: raffleId });

      const { error } = await c.membroA.client
        .from("raffles")
        .update({ participant_mode: "todos" })
        .eq("id", raffleId);
      assert.equal(error?.message, "sorteio_bloqueado");
    });

    it("anfitriã de outro evento não muda o modo", async () => {
      const raffleId = await sorteioAutomatico(c.eventos.aPublicado, "todos");
      const { data } = await c.membroB.client
        .from("raffles")
        .update({ participant_mode: "selecionados" })
        .eq("id", raffleId)
        .select("id");
      assert.deepEqual(data ?? [], []);

      const { data: atual } = await admin
        .from("raffles")
        .select("participant_mode")
        .eq("id", raffleId)
        .single();
      assert.equal(atual.participant_mode, "todos");
    });
  });

  it("convidado removido continua no resultado com o nome copiado", async () => {
    const convidados = await criarConvidados(c.eventos.aPublicado, 2, "Removido");
    const { raffleId } = await montarSorteio(c.eventos.aPublicado, {
      premios: [{ name: "Prêmio" }],
      convidados,
    });
    const anfitria = c.membroA.client;
    await anfitria.rpc("start_raffle", { p_raffle_id: raffleId });
    const { data: sorteado } = await anfitria.rpc("draw_raffle_winner", { p_raffle_id: raffleId });

    const guestId = convidados.find((g) => g.name === sorteado[0].display_name).id;
    const { error } = await anfitria.from("guests").delete().eq("id", guestId);
    assert.equal(error, null, "apagar convidado não pode esbarrar no bloqueio do sorteio");

    const { data: part } = await admin
      .from("raffle_participants")
      .select("guest_id, display_name")
      .eq("id", sorteado[0].participant_id)
      .single();
    assert.equal(part.guest_id, null);
    assert.equal(part.display_name, sorteado[0].display_name);
  });
});
