import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { admin, anonimo, montarCenario } from "./harness.mjs";

/**
 * Cenários das specs `convidados` e `rsvp` de `add-guests-rsvp-backend`,
 * contra o banco local. Cobre RLS de `guests`/`guest_invites` e as funções
 * `security definer` que o convidado sem conta usa.
 *
 * Pré-requisito: `npm run db:start`.
 */
describe("convidados e RSVP", () => {
  let c;
  let tokenA;

  before(async () => {
    c = await montarCenario();

    // aPublicado precisa do módulo de RSVP habilitado para os testes de
    // submissão; o harness não liga módulo nenhum por padrão.
    await admin
      .from("event_modules")
      .insert({ event_id: c.eventos.aPublicado, module: "rsvp" });

    const { data: guest, error } = await admin
      .from("guests")
      .insert({ event_id: c.eventos.aPublicado, name: "Convidado A" })
      .select("id")
      .single();
    if (error) throw new Error(`Falha ao criar convidado: ${error.message}`);
    c.guestA = guest.id;

    const { data: invite, error: inviteError } = await admin
      .from("guest_invites")
      .insert({ guest_id: guest.id })
      .select("token")
      .single();
    if (inviteError) throw new Error(`Falha ao criar convite: ${inviteError.message}`);
    tokenA = invite.token;
  });

  after(async () => {
    await c.limpar();
  });

  describe("cadastro de convidado", () => {
    it("quem administra o evento cadastra convidado", async () => {
      const { data, error } = await c.membroA.client
        .from("guests")
        .insert({ event_id: c.eventos.aPublicado, name: "Novo Convidado" })
        .select("id, status")
        .single();

      assert.equal(error, null);
      assert.equal(data.status, "pendente");
    });

    it("nome ausente é recusado", async () => {
      const { error } = await c.membroA.client
        .from("guests")
        .insert({ event_id: c.eventos.aPublicado });

      assert.ok(error, "nome é not null — a inserção deveria falhar");
    });

    it("quem não administra o evento não cadastra convidado", async () => {
      const { error } = await c.membroB.client
        .from("guests")
        .insert({ event_id: c.eventos.aPublicado, name: "Intruso" })
        .select("id");

      assert.ok(error, "o `with check` de guests_manage deveria recusar");
    });

    it("convidado de um evento não aparece no contexto de outro", async () => {
      const { data } = await c.membroB.client
        .from("guests")
        .select("id")
        .eq("id", c.guestA);

      assert.deepEqual(data, []);
    });
  });

  describe("privacidade de guests e guest_invites", () => {
    it("anon não lê guests diretamente", async () => {
      const { error } = await anonimo.from("guests").select("id");
      assert.ok(error, "sem grant/política de select para anon");
    });

    it("anon não lê guest_invites diretamente", async () => {
      const { error } = await anonimo.from("guest_invites").select("token");
      assert.ok(error, "token não pode ser lido em massa");
    });
  });

  describe("token de convite", () => {
    it("identifica o convidado certo", async () => {
      const { data } = await anonimo
        .rpc("get_guest_by_invite_token", { p_token: tokenA })
        .maybeSingle();

      assert.equal(data?.name, "Convidado A");
    });

    it("token inexistente não identifica ninguém", async () => {
      const { data } = await anonimo
        .rpc("get_guest_by_invite_token", { p_token: "token-que-nao-existe" })
        .maybeSingle();

      assert.equal(data, null);
    });
  });

  describe("submissão de RSVP", () => {
    it("confirma presença com acompanhantes e crianças", async () => {
      const { data, error } = await anonimo
        .rpc("submit_rsvp", {
          p_token: tokenA,
          p_status: "confirmado",
          p_companions: 2,
          p_kids: 1,
          p_dietary: "vegetariano",
        })
        .single();

      assert.equal(error, null);
      assert.equal(data.status, "confirmado");
      assert.equal(data.companions, 2);
      assert.equal(data.kids, 1);
    });

    it("recusa zera acompanhantes e crianças", async () => {
      const { data } = await anonimo
        .rpc("submit_rsvp", {
          p_token: tokenA,
          p_status: "recusado",
          p_companions: 3,
          p_kids: 2,
          p_dietary: null,
        })
        .single();

      assert.equal(data.status, "recusado");
      assert.equal(data.companions, 0);
      assert.equal(data.kids, 0);
    });

    it("token inválido é recusado", async () => {
      const { error } = await anonimo.rpc("submit_rsvp", {
        p_token: "token-invalido",
        p_status: "confirmado",
        p_companions: 0,
        p_kids: 0,
        p_dietary: null,
      });

      assert.ok(error);
      assert.match(error.message, /convite_invalido/);
    });

    it("módulo de RSVP desabilitado recusa a resposta", async () => {
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

      const { error } = await anonimo.rpc("submit_rsvp", {
        p_token: invite.token,
        p_status: "confirmado",
        p_companions: 0,
        p_kids: 0,
        p_dietary: null,
      });

      assert.ok(error);
      assert.match(error.message, /modulo_desabilitado/);
    });

    it("prazo encerrado recusa a resposta e preserva a anterior", async () => {
      // `rsvp_deadline` não pode ser anterior a `created_at` (constraint da
      // migration) — para simular um prazo já vencido, os dois recuam juntos
      // para o passado, mantendo deadline > created_at.
      const { error: setupError } = await admin
        .from("events")
        .update({
          created_at: "2000-01-01T00:00:00Z",
          rsvp_deadline: "2000-01-02T00:00:00Z",
        })
        .eq("id", c.eventos.aPublicado);
      assert.equal(setupError, null);

      const { error } = await anonimo.rpc("submit_rsvp", {
        p_token: tokenA,
        p_status: "confirmado",
        p_companions: 0,
        p_kids: 0,
        p_dietary: null,
      });

      assert.ok(error);
      assert.match(error.message, /prazo_encerrado/);

      const { data: guest } = await admin
        .from("guests")
        .select("status")
        .eq("id", c.guestA)
        .single();
      assert.equal(guest.status, "recusado", "resposta anterior deveria continuar valendo");

      await admin.from("events").update({ rsvp_deadline: null }).eq("id", c.eventos.aPublicado);
    });
  });

  describe("lista aberta", () => {
    it("lista fechada recusa RSVP de quem não foi convidado", async () => {
      const { error } = await anonimo.rpc("submit_open_rsvp", {
        p_event_slug: `a-publicado-${c.tag}`,
        p_name: "Visitante",
        p_status: "confirmado",
        p_companions: 0,
        p_kids: 0,
        p_dietary: null,
      });

      assert.ok(error);
      assert.match(error.message, /lista_fechada/);
    });

    it("lista aberta cria convidado não listado", async () => {
      await admin
        .from("events")
        .update({ guest_list_open: true })
        .eq("id", c.eventos.aPublicado);

      const { data, error } = await anonimo
        .rpc("submit_open_rsvp", {
          p_event_slug: `a-publicado-${c.tag}`,
          p_name: "Visitante Sem Convite",
          p_status: "confirmado",
          p_companions: 1,
          p_kids: 0,
          p_dietary: null,
        })
        .single();

      assert.equal(error, null);
      assert.equal(data.unlisted, true);
      assert.equal(data.name, "Visitante Sem Convite");

      await admin
        .from("events")
        .update({ guest_list_open: false })
        .eq("id", c.eventos.aPublicado);
    });
  });

  describe("duplicata na importação", () => {
    it("mesmo nome e e-mail no evento é recusado pela constraint única", async () => {
      const { error: firstError } = await c.membroA.client
        .from("guests")
        .insert({ event_id: c.eventos.aPublicado, name: "Duplicado", email: "dup@teste.local" });
      assert.equal(firstError, null);

      const { error: secondError } = await c.membroA.client
        .from("guests")
        .insert({ event_id: c.eventos.aPublicado, name: "Duplicado", email: "dup@teste.local" });

      assert.ok(secondError, "guests_event_name_email_idx deveria recusar a duplicata");
      assert.equal(secondError.code, "23505");
    });
  });
});
