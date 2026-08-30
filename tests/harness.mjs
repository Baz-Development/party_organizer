import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile, requireEnv } from "../scripts/db/_env.mjs";

loadEnvFile();

const URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const ANON = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SERVICE = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

/** Senha só existe para os testes: a aplicação entra por link mágico. */
const SENHA = "senha-de-teste-123456";

const semSessao = { auth: { persistSession: false, autoRefreshToken: false } };

/** Cliente `service-role`: ignora a RLS. Usado só para montar o cenário. */
export const admin = createClient(URL, SERVICE, semSessao);

/** Cliente sem sessão nenhuma — é o convidado que abre o link do evento. */
export const anonimo = createClient(URL, ANON, semSessao);

/**
 * Cria um usuário e devolve um client autenticado como ele.
 *
 * O client carrega o token no header em vez de sessão persistida, que é o que
 * faz `auth.uid()` valer dentro das políticas.
 */
async function criarUsuario(email, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
  });
  if (error) throw new Error(`Falha ao criar ${email}: ${error.message}`);

  const profileId = data.user.id;

  if (role !== "cliente") {
    // Papel só se define fora da aplicação — aqui, com a chave service-role.
    const { error: roleError } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", profileId);
    if (roleError) throw new Error(`Falha ao definir papel: ${roleError.message}`);
  }

  const login = createClient(URL, ANON, semSessao);
  const { data: sessao, error: loginError } = await login.auth.signInWithPassword({
    email,
    password: SENHA,
  });
  if (loginError) throw new Error(`Falha no login de ${email}: ${loginError.message}`);

  const client = createClient(URL, ANON, {
    ...semSessao,
    global: { headers: { Authorization: `Bearer ${sessao.session.access_token}` } },
  });

  return { id: profileId, email, role, client };
}

/**
 * Monta um cenário completo e isolado: dois anfitriões (`cliente`) que não se
 * conhecem e um admin da plataforma. O isolamento a proteger é por evento e por
 * anfitrião — não há mais fronteira de organização.
 *
 * `membroA`/`membroB` são anfitriões comuns; os nomes são históricos, mantidos
 * para não reescrever os testes que dependem deles.
 *
 * Cada execução usa um sufixo único para que rodar os testes duas vezes
 * seguidas não esbarre em e-mail ou slug repetido.
 */
export async function montarCenario() {
  const tag = randomUUID().slice(0, 8);
  const criados = { users: [], events: [] };

  const [cliente, membroA, membroB, plataforma] = await Promise.all([
    criarUsuario(`cliente-${tag}@teste.local`, "cliente"),
    criarUsuario(`anfitriao-a-${tag}@teste.local`, "cliente"),
    criarUsuario(`anfitriao-b-${tag}@teste.local`, "cliente"),
    criarUsuario(`admin-${tag}@teste.local`, "admin"),
  ]);
  criados.users.push(cliente.id, membroA.id, membroB.id, plataforma.id);

  const eventos = {
    aPublicado: await criarEvento({
      slug: `a-publicado-${tag}`,
      hostProfileId: membroA.id,
      status: "publicado",
    }),
    aRascunho: await criarEvento({
      slug: `a-rascunho-${tag}`,
      hostProfileId: membroA.id,
      status: "rascunho",
    }),
    bRascunho: await criarEvento({
      slug: `b-rascunho-${tag}`,
      hostProfileId: membroB.id,
      status: "rascunho",
    }),
    doCliente: await criarEvento({
      slug: `cliente-${tag}`,
      hostProfileId: cliente.id,
      status: "rascunho",
    }),
  };
  criados.events.push(...Object.values(eventos));

  return {
    tag,
    cliente,
    membroA,
    membroB,
    plataforma,
    eventos,
    limpar: () => limpar(criados),
  };
}

async function criarEvento({ slug, hostProfileId, status }) {
  const { data, error } = await admin
    .from("events")
    .insert({
      slug,
      host_profile_id: hostProfileId,
      kind: "casamento",
      title: `Evento ${slug}`,
      event_at: "2027-01-01T18:00:00-03:00",
      status,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Falha ao criar evento ${slug}: ${error.message}`);

  return data.id;
}

async function limpar({ users, events }) {
  // Eventos antes de perfis: host_profile_id não tem cascade.
  await admin.from("events").delete().in("id", events);
  for (const id of users) {
    await admin.auth.admin.deleteUser(id);
  }
}
