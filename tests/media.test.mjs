import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { admin, anonimo, montarCenario } from "./harness.mjs";

/**
 * Cenários das specs `midia-storage`, `galeria` e `mural` de
 * `add-media-storage-backend`, contra o banco local. Cobre RLS de
 * `photos`/`mural_messages`/`reactions`, as funções `security definer` do
 * caminho do convidado, moderação e as políticas de `storage.objects` dos
 * dois buckets.
 *
 * Pré-requisito: `npm run db:start`.
 */
describe("galeria, mural e storage", () => {
  let c;

  before(async () => {
    c = await montarCenario();

    await admin
      .from("event_modules")
      .insert([
        { event_id: c.eventos.aPublicado, module: "galeria" },
        { event_id: c.eventos.aPublicado, module: "mural" },
      ]);
  });

  after(async () => {
    await c.limpar();
  });

  const slug = () => `a-publicado-${c.tag}`;
  const visitor = () => crypto.randomUUID();

  describe("envio de foto", () => {
    it("convidado envia foto e ela nasce pendente (política padrão)", async () => {
      const { data: eventId, error: assertError } = await anonimo.rpc("assert_can_submit_photo", {
        p_event_slug: slug(),
        p_visitor_id: visitor(),
      });
      assert.equal(assertError, null);
      assert.equal(eventId, c.eventos.aPublicado);

      const v = visitor();
      const { data, error } = await anonimo
        .rpc("submit_photo", {
          p_event_slug: slug(),
          p_storage_path: `${c.eventos.aPublicado}/teste-1.jpg`,
          p_author: "Convidado Anônimo",
          p_caption: "Uma legenda",
          p_visitor_id: v,
          p_guest_token: null,
        })
        .single();

      assert.equal(error, null);
      assert.equal(data.status, "pendente");
      assert.equal(data.author, "Convidado Anônimo");
    });

    it("autor ausente e sem token é recusado", async () => {
      const { error } = await anonimo.rpc("submit_photo", {
        p_event_slug: slug(),
        p_storage_path: `${c.eventos.aPublicado}/teste-2.jpg`,
        p_author: "",
        p_caption: null,
        p_visitor_id: visitor(),
        p_guest_token: null,
      });

      assert.ok(error);
      assert.match(error.message, /autor_ausente/);
    });

    it("caminho de outro evento é recusado", async () => {
      const { error } = await anonimo.rpc("submit_photo", {
        p_event_slug: slug(),
        p_storage_path: `${c.eventos.bRascunho}/teste-3.jpg`,
        p_author: "Alguém",
        p_caption: null,
        p_visitor_id: visitor(),
        p_guest_token: null,
      });

      assert.ok(error);
      assert.match(error.message, /caminho_invalido/);
    });

    it("módulo desabilitado recusa o envio", async () => {
      const { error } = await anonimo.rpc("submit_photo", {
        p_event_slug: `cliente-${c.tag}`,
        p_storage_path: `${c.eventos.doCliente}/teste.jpg`,
        p_author: "Alguém",
        p_caption: null,
        p_visitor_id: visitor(),
        p_guest_token: null,
      });

      assert.ok(error);
      assert.match(error.message, /(evento_invalido|modulo_desabilitado)/);
    });

    it("limite de envios por intervalo é aplicado", async () => {
      const v = visitor();
      for (let i = 0; i < 10; i += 1) {
        const { error } = await anonimo.rpc("submit_photo", {
          p_event_slug: slug(),
          p_storage_path: `${c.eventos.aPublicado}/limite-${i}.jpg`,
          p_author: "Autor Repetido",
          p_caption: null,
          p_visitor_id: v,
          p_guest_token: null,
        });
        assert.equal(error, null, `envio ${i} deveria passar`);
      }

      const { error: exceeded } = await anonimo.rpc("submit_photo", {
        p_event_slug: slug(),
        p_storage_path: `${c.eventos.aPublicado}/limite-extra.jpg`,
        p_author: "Autor Repetido",
        p_caption: null,
        p_visitor_id: v,
        p_guest_token: null,
      });

      assert.ok(exceeded);
      assert.match(exceeded.message, /limite_envios/);
    });
  });

  describe("moderação e visibilidade da galeria", () => {
    let photoId;

    before(async () => {
      const { data } = await anonimo
        .rpc("submit_photo", {
          p_event_slug: slug(),
          p_storage_path: `${c.eventos.aPublicado}/moderacao.jpg`,
          p_author: "Fotógrafo",
          p_caption: null,
          p_visitor_id: visitor(),
          p_guest_token: null,
        })
        .single();
      photoId = data.id;
    });

    it("público não vê foto pendente", async () => {
      const { data } = await anonimo.from("photos").select("id").eq("id", photoId);
      assert.deepEqual(data, []);
    });

    it("quem administra o evento vê a pendente", async () => {
      const { data } = await c.membroA.client.from("photos").select("id").eq("id", photoId);
      assert.equal(data.length, 1);
    });

    it("quem não administra o evento não vê a pendente", async () => {
      const { data } = await c.membroB.client.from("photos").select("id").eq("id", photoId);
      assert.deepEqual(data, []);
    });

    it("convidado não aprova foto", async () => {
      const { error } = await anonimo.from("photos").update({ status: "aprovada" }).eq("id", photoId);
      // Sem grant de update para anon — o PostgREST recusa antes mesmo da RLS.
      assert.ok(error);
    });

    it("quem não administra não aprova foto de outro evento", async () => {
      const { data, error } = await c.membroB.client
        .from("photos")
        .update({ status: "aprovada" })
        .eq("id", photoId)
        .select("id");
      assert.equal(error, null);
      assert.deepEqual(data, [], "with check deveria impedir a atualização");
    });

    it("quem administra aprova a foto e ela passa a ser pública", async () => {
      const { data, error } = await c.membroA.client
        .from("photos")
        .update({ status: "aprovada" })
        .eq("id", photoId)
        .select("status")
        .single();
      assert.equal(error, null);
      assert.equal(data.status, "aprovada");

      const { data: publico } = await anonimo.from("photos").select("id").eq("id", photoId);
      assert.equal(publico.length, 1);
    });

    it("quem administra oculta a foto e ela some do público", async () => {
      await c.membroA.client.from("photos").update({ status: "oculta" }).eq("id", photoId);

      const { data } = await anonimo.from("photos").select("id").eq("id", photoId);
      assert.deepEqual(data, []);
    });
  });

  describe("curtidas", () => {
    let photoId;

    before(async () => {
      const { data } = await anonimo
        .rpc("submit_photo", {
          p_event_slug: slug(),
          p_storage_path: `${c.eventos.aPublicado}/curtida.jpg`,
          p_author: "Alguém",
          p_caption: null,
          p_visitor_id: visitor(),
          p_guest_token: null,
        })
        .single();
      photoId = data.id;
      await admin.from("photos").update({ status: "aprovada" }).eq("id", photoId);
    });

    it("curtida em item pendente/oculto é recusada", async () => {
      const { data: pendente } = await anonimo
        .rpc("submit_photo", {
          p_event_slug: slug(),
          p_storage_path: `${c.eventos.aPublicado}/curtida-pendente.jpg`,
          p_author: "Alguém",
          p_caption: null,
          p_visitor_id: visitor(),
          p_guest_token: null,
        })
        .single();

      const { error } = await anonimo.rpc("react_to_item", {
        p_target_type: "foto",
        p_target_id: pendente.id,
        p_visitor_id: visitor(),
      });

      assert.ok(error);
      assert.match(error.message, /item_nao_visivel/);
    });

    it("curtida conta uma vez por visitante", async () => {
      const v = visitor();

      const { data: first } = await anonimo
        .rpc("react_to_item", { p_target_type: "foto", p_target_id: photoId, p_visitor_id: v })
        .single();
      assert.equal(first, 1);

      const { data: second } = await anonimo
        .rpc("react_to_item", { p_target_type: "foto", p_target_id: photoId, p_visitor_id: v })
        .single();
      assert.equal(second, 1, "segunda curtida do mesmo visitante não deveria contar de novo");

      const { data: other } = await anonimo
        .rpc("react_to_item", { p_target_type: "foto", p_target_id: photoId, p_visitor_id: visitor() })
        .single();
      assert.equal(other, 2, "visitante diferente deveria contar");
    });
  });

  describe("mural", () => {
    it("recado publicado nasce pendente e mensagem vazia é recusada", async () => {
      const { data, error } = await anonimo
        .rpc("submit_mural_message", {
          p_event_slug: slug(),
          p_author: "Convidado",
          p_message: "Parabéns!",
          p_visitor_id: visitor(),
          p_guest_token: null,
        })
        .single();
      assert.equal(error, null);
      assert.equal(data.status, "pendente");

      const { error: vazioError } = await anonimo.rpc("submit_mural_message", {
        p_event_slug: slug(),
        p_author: "Convidado",
        p_message: "   ",
        p_visitor_id: visitor(),
        p_guest_token: null,
      });
      assert.ok(vazioError);
      assert.match(vazioError.message, /mensagem_vazia/);
    });

    it("conteúdo HTML é guardado como texto literal", async () => {
      const { data } = await anonimo
        .rpc("submit_mural_message", {
          p_event_slug: slug(),
          p_author: "Convidado",
          p_message: "<script>alert(1)</script>",
          p_visitor_id: visitor(),
          p_guest_token: null,
        })
        .single();
      assert.equal(data.message, "<script>alert(1)</script>");
    });

    it("limite de recados por intervalo é aplicado", async () => {
      const v = visitor();
      for (let i = 0; i < 5; i += 1) {
        const { error } = await anonimo.rpc("submit_mural_message", {
          p_event_slug: slug(),
          p_author: "Convidado Repetido",
          p_message: `Recado ${i}`,
          p_visitor_id: v,
          p_guest_token: null,
        });
        assert.equal(error, null);
      }

      const { error: exceeded } = await anonimo.rpc("submit_mural_message", {
        p_event_slug: slug(),
        p_author: "Convidado Repetido",
        p_message: "Recado extra",
        p_visitor_id: v,
        p_guest_token: null,
      });
      assert.ok(exceeded);
      assert.match(exceeded.message, /limite_envios/);
    });
  });

  describe("política de moderação e capa do evento", () => {
    it("quem administra altera a política de moderação", async () => {
      const { data, error } = await c.membroA.client
        .from("events")
        .update({ moderation_policy: "imediata" })
        .eq("id", c.eventos.aPublicado)
        .select("moderation_policy")
        .single();
      assert.equal(error, null);
      assert.equal(data.moderation_policy, "imediata");

      // Envio seguinte já nasce aprovado.
      const { data: photo } = await anonimo
        .rpc("submit_photo", {
          p_event_slug: slug(),
          p_storage_path: `${c.eventos.aPublicado}/imediata.jpg`,
          p_author: "Alguém",
          p_caption: null,
          p_visitor_id: visitor(),
          p_guest_token: null,
        })
        .single();
      assert.equal(photo.status, "aprovada");

      await admin
        .from("events")
        .update({ moderation_policy: "previa" })
        .eq("id", c.eventos.aPublicado);
    });

    it("quem não administra não altera política nem capa", async () => {
      const { data, error } = await c.membroB.client
        .from("events")
        .update({ moderation_policy: "imediata", cover_path: `${c.eventos.aPublicado}/capa.jpg` })
        .eq("id", c.eventos.aPublicado)
        .select("id");
      assert.equal(error, null);
      assert.deepEqual(data, [], "with check deveria impedir a atualização");
    });
  });

  describe("storage", () => {
    const bucket = "guest-uploads";

    it("convidado não escreve direto no bucket de envios (sem URL assinada)", async () => {
      const path = `${c.eventos.aPublicado}/direto.jpg`;
      const { error } = await anonimo.storage
        .from(bucket)
        .upload(path, new Blob(["conteudo"], { type: "image/jpeg" }));
      assert.ok(error, "sem política de insert para anon/authenticated");
    });

    it("leitura de arquivo respeita a moderação: só aprovado é público", async () => {
      const path = `${c.eventos.aPublicado}/storage-teste.jpg`;

      const { error: uploadError } = await admin.storage
        .from(bucket)
        .upload(path, new Blob(["conteudo"], { type: "image/jpeg" }), { contentType: "image/jpeg" });
      assert.equal(uploadError, null);

      const { data: photo, error: insertError } = await admin
        .from("photos")
        .insert({
          event_id: c.eventos.aPublicado,
          visitor_id: crypto.randomUUID(),
          author: "Teste Storage",
          storage_path: path,
          status: "pendente",
        })
        .select("id")
        .single();
      assert.equal(insertError, null);

      const { data: pendingUrl } = await anonimo.storage.from(bucket).createSignedUrl(path, 60);
      assert.equal(pendingUrl, null, "arquivo de item pendente não deveria ser legível pelo público");

      const { data: managerUrl } = await c.membroA.client.storage
        .from(bucket)
        .createSignedUrl(path, 60);
      assert.ok(managerUrl?.signedUrl, "quem administra deveria ler mesmo pendente");

      await admin.from("photos").update({ status: "aprovada" }).eq("id", photo.id);

      const { data: publicUrl } = await anonimo.storage.from(bucket).createSignedUrl(path, 60);
      assert.ok(publicUrl?.signedUrl, "aprovada deveria ser legível pelo público");
    });
  });
});
