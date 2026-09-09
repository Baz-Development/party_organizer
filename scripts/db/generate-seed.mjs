#!/usr/bin/env node
/**
 * Converte `src/lib/mock-data.ts` em `supabase/seed.sql`.
 *
 * É um gerador, e não um dump colado à mão, para que a conversão fique
 * auditável: quando um mock mudar, o seed é regerado e o diff mostra
 * exatamente o que mudou no banco.
 *
 * O Node 24 executa o `.ts` direto (apaga os tipos), então lemos os mocks como
 * módulo em vez de tentar interpretar o arquivo como texto.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const MOCK_PATH = resolve("src/lib/mock-data.ts");
const OUTPUT = resolve("supabase/seed.sql");

/** Fuso dos eventos de exemplo — todos acontecem no Brasil. */
const TZ_OFFSET = "-03:00";

/** Domínio dos e-mails de exemplo. Não existe, e é essa a intenção. */
const EMAIL_DOMAIN = "exemplo.local";

const ADMIN_EMAIL = `admin@${EMAIL_DOMAIN}`;

/**
 * UUID v5: mesmo nome, mesmo id, sempre. Sem isso, cada geração do seed
 * produziria ids novos e o diff seria ilegível.
 */
const SEED_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

function uuidv5(name) {
  const namespace = Buffer.from(SEED_NAMESPACE.replace(/-/g, ""), "hex");
  const hash = createHash("sha1")
    .update(Buffer.concat([namespace, Buffer.from(name, "utf8")]))
    .digest();

  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // versão 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122

  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

/** Literal SQL de texto, com aspas simples escapadas. */
function txt(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function uuid(value) {
  return `'${value}'::uuid`;
}

function list(values) {
  return values.join(",\n  ");
}

/**
 * Cardápio e bar: `update` das colunas de texto em `events` e `insert` nas
 * tabelas de itens. Só emite cada bloco quando há dados — `insert ... values ;`
 * sem linhas é erro de sintaxe.
 */
function menuBarSql(events, eventId) {
  const blocks = [];

  const barUpdates = events
    .filter((e) => e.bar.service || e.bar.signatureName || e.bar.signatureDesc)
    .map(
      (e) =>
        `update public.events set bar_service = ${txt(e.bar.service)}, ` +
        `bar_signature_name = ${txt(e.bar.signatureName)}, ` +
        `bar_signature_desc = ${txt(e.bar.signatureDesc)} ` +
        `where id = ${uuid(eventId(e.slug))};`,
    );
  if (barUpdates.length) blocks.push(barUpdates.join("\n"));

  const menuRows = events.flatMap((e) =>
    e.menu.map(
      (item, index) =>
        `  (${uuid(eventId(e.slug))}, ${index}, ${txt(item.course)}, ${txt(item.name)}, ${txt(item.desc)})`,
    ),
  );
  if (menuRows.length) {
    blocks.push(
      `insert into public.menu_items (event_id, position, course, name, description)\nvalues\n${menuRows.join(",\n")};`,
    );
  }

  const barRows = events.flatMap((e) =>
    e.bar.items.map(
      (item, index) =>
        `  (${uuid(eventId(e.slug))}, ${index}, ${txt(item.name)}, ${txt(item.desc)})`,
    ),
  );
  if (barRows.length) {
    blocks.push(
      `insert into public.bar_items (event_id, position, name, description)\nvalues\n${barRows.join(",\n")};`,
    );
  }

  return blocks.length ? `\n${blocks.join("\n\n")}\n` : "";
}

export async function generateSeed() {
  const mocks = await import(pathToFileURL(MOCK_PATH).href);
  const { EVENTS } = mocks;

  // ---------------------------------------------------------------------
  // Pessoas: um admin e um anfitrião por evento. Todos entram por link
  // mágico — não há senha no seed.
  // ---------------------------------------------------------------------
  const people = new Map();

  const addPerson = (email, displayName, role) => {
    if (!people.has(email)) {
      people.set(email, { id: uuidv5(`user:${email}`), email, displayName, role });
    }
    return people.get(email);
  };

  addPerson(ADMIN_EMAIL, "Admin da plataforma", "admin");

  const eventHost = new Map();
  for (const event of EVENTS) {
    const email = `${event.slug}@${EMAIL_DOMAIN}`;
    eventHost.set(event.slug, addPerson(email, event.hosts, "cliente"));
  }

  const eventId = (slug) => uuidv5(`event:${slug}`);

  const everyone = [...people.values()];
  const userIds = everyone.map((p) => uuid(p.id));
  const eventIds = EVENTS.map((e) => uuid(eventId(e.slug)));

  const sql = `-- Gerado por \`npm run db:seed\` a partir de src/lib/mock-data.ts.
-- Não edite à mão: rode o script de novo depois de mudar os mocks.
--
-- Dados de desenvolvimento. Todos os e-mails são de um domínio inexistente
-- (${EMAIL_DOMAIN}) e nenhuma senha é definida: entre pelo link mágico,
-- lendo a caixa de e-mail local.
--
-- Entre como ${ADMIN_EMAIL} para ver o painel administrativo.

begin;

-- Rodar o seed duas vezes não pode duplicar nada. A ordem importa: eventos
-- antes de perfis, porque events.host_profile_id não tem cascade.
delete from public.events where id in (
  ${list(eventIds)}
);
delete from auth.users where id in (
  ${list(userIds)}
);

-- ---------------------------------------------------------------------------
-- Identidades
--
-- Espelha o que a API admin do GoTrue gravaria: além de auth.users, o
-- \`instance_id\` (o GoTrue restringe toda consulta a esse valor), as colunas de
-- token como string vazia (o GoTrue as lê como texto, não aceita NULL) e uma
-- linha em auth.identities com provider 'email'. Sem isso o usuário fica
-- invisível para o GoTrue: o login por link mágico responde 500 e nenhum
-- e-mail é enviado.
-- ---------------------------------------------------------------------------

insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
)
values
${everyone
  .map(
    (person) => `  (
    ${uuid(person.id)}, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', ${txt(person.email)}, now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    ${txt(JSON.stringify({ display_name: person.displayName }))}::jsonb,
    now(), now(),
    '', '', '', '', '', '', '', ''
  )`,
  )
  .join(",\n")};

insert into auth.identities (
  provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
values
${everyone
  .map(
    (person) => `  (
    ${txt(person.id)}, ${uuid(person.id)},
    jsonb_build_object('sub', ${txt(person.id)}, 'email', ${txt(person.email)}, 'email_verified', true),
    'email', now(), now(), now()
  )`,
  )
  .join(",\n")};

-- O trigger on_auth_user_created já criou os perfis; aqui definimos nome de
-- exibição e papel. O papel de admin nunca é atribuível pela aplicação — só
-- por seed ou operação administrativa, ambas sem sessão. As contas de cliente
-- entram como provisionadas pelo admin, refletindo o fluxo da ata (a Equipe
-- Villa Glam cadastra o cliente antes do primeiro acesso).
insert into public.profiles (id, email, display_name, role, provisioned)
values
${everyone
  .map(
    (person) =>
      `  (${uuid(person.id)}, ${txt(person.email)}, ${txt(person.displayName)}, ${txt(person.role)}::public.user_role, ${person.role === "cliente"})`,
  )
  .join(",\n")}
on conflict (id) do update
  set display_name = excluded.display_name,
      role = excluded.role,
      provisioned = excluded.provisioned;

-- ---------------------------------------------------------------------------
-- Eventos
--
-- Os quatro saem publicados, para que as telas do convidado fiquem navegáveis
-- logo depois do reset. (O mock trazia "aniversario-do-bento" em rascunho.)
-- ---------------------------------------------------------------------------

insert into public.events (
  id, slug, host_profile_id, kind, title, event_at,
  venue, city, address, postal_code, hosts, eyebrow, welcome, theme_key, status
)
values
${EVENTS.map((event) => {
  return `  (
    ${uuid(eventId(event.slug))}, ${txt(event.slug)},
    ${uuid(eventHost.get(event.slug).id)},
    ${txt(event.kind)}::public.event_kind, ${txt(event.title)},
    ${txt(`${event.date}${TZ_OFFSET}`)}::timestamptz,
    ${txt(event.venue)}, ${txt(event.city)},
    ${txt(event.address)}, ${txt(event.postalCode)}, ${txt(event.hosts)},
    ${txt(event.eyebrow)}, ${txt(event.welcome)},
    ${txt(event.themeKey)}::public.theme_key, 'publicado'::public.event_status
  )`;
}).join(",\n")};

insert into public.event_modules (event_id, module)
values
${EVENTS.flatMap((event) =>
  event.modules.map(
    (module) =>
      `  (${uuid(eventId(event.slug))}, ${txt(module)}::public.module_id)`,
  ),
).join(",\n")};

insert into public.schedule_items (event_id, position, time, title, description)
values
${EVENTS.flatMap((event) =>
  event.schedule.map(
    (item, index) =>
      `  (${uuid(eventId(event.slug))}, ${index}, ${txt(item.time)}, ${txt(item.title)}, ${txt(item.desc)})`,
  ),
).join(",\n")};
${menuBarSql(EVENTS, eventId)}
commit;
`;

  writeFileSync(OUTPUT, sql, "utf8");
  return { output: OUTPUT, events: EVENTS.length, people: everyone.length };
}

// Executado diretamente: só gera o arquivo, sem tocar no banco.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { output, events, people } = await generateSeed();
  console.log(`Seed gerado em ${output} (${events} eventos, ${people} pessoas).`);
}
