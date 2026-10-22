import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { resolveSlugCollision, slugify } from "@/lib/slug";
import type { BarItem, EventSummary, MenuItem, ModuleId, ScheduleItem } from "@/lib/types";
import type { CreateEventInput, UpdateEventInput } from "@/lib/validation/event";
import { CHECK_VIOLATION, DbError, SlugConflictError, UNIQUE_VIOLATION } from "./errors";
import { toEventSummary, type EventRowWithContent } from "./mappers";

type Client = SupabaseClient<Database>;

/**
 * Acesso a eventos.
 *
 * Toda função recebe o client já com a sessão de quem pediu, de modo que a RLS
 * escopa o resultado: um cliente vê só os próprios eventos, um admin vê todos,
 * o convidado vê só o que está publicado. Nenhuma destas funções filtra por
 * dono na aplicação — se filtrasse, um esquecimento viraria vazamento.
 */

/**
 * Traz o evento com módulos e cronograma numa consulta só. Cronograma e
 * módulos são pequenos e sempre usados junto com o evento; separá-los
 * custaria dois round-trips por página.
 */
const EVENT_SELECT = `
  id, slug, host_profile_id, kind, title, event_at, venue,
  city, address, postal_code, hosts, eyebrow, welcome, theme_key,
  accent_color, accent_text_color, background_color, status, created_at, updated_at,
  rsvp_deadline, section_order, self_signup_token, moderation_policy, cover_path,
  secret_santa_budget, secret_santa_draw_date, secret_santa_exchange_date, secret_santa_rules,
  bar_service, bar_signature_name, bar_signature_desc,
  event_modules ( module ),
  schedule_items ( position, time, title, description ),
  menu_items ( position, course, name, description ),
  bar_items ( position, name, description )
`;

export interface ListEventsOptions {
  hostProfileId?: string;
  status?: Database["public"]["Enums"]["event_status"];
}

export async function listEvents(
  client: Client,
  options: ListEventsOptions = {},
): Promise<EventSummary[]> {
  let query = client.from("events").select(EVENT_SELECT).order("event_at", { ascending: true });

  if (options.hostProfileId) query = query.eq("host_profile_id", options.hostProfileId);
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) throw new DbError(error.message, "desconhecido");

  return (data as unknown as EventRowWithContent[]).map(toEventSummary);
}

export async function getEventBySlug(
  client: Client,
  slug: string,
): Promise<EventSummary | null> {
  const { data, error } = await client
    .from("events")
    .select(EVENT_SELECT)
    .eq("slug", slug)
    // `maybeSingle` em vez de `single`: slug inexistente e slug invisível pela
    // RLS devem ser indistinguíveis — os dois viram 404.
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) return null;

  return toEventSummary(data as unknown as EventRowWithContent);
}

/**
 * Traz o evento pelo id — é o que identifica a rota pública (`/[id]/[slug]`).
 * O slug na URL é só cosmético; quem resolve a página é o id.
 */
export async function getEventById(
  client: Client,
  id: string,
): Promise<EventSummary | null> {
  const { data, error } = await client
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", id)
    // Id inexistente e evento invisível pela RLS devem ser indistinguíveis —
    // os dois viram 404.
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) return null;

  return toEventSummary(data as unknown as EventRowWithContent);
}

export async function createEvent(
  client: Client,
  input: CreateEventInput,
  hostProfileId: string,
): Promise<EventSummary> {
  const explicitSlug = input.slug;
  const base = explicitSlug ?? slugify(input.title);

  // A unicidade é garantida pelo banco, não por uma consulta prévia: a RLS
  // esconde eventos de terceiros, então "não encontrei esse slug" não prova
  // que ele está livre. Tentamos inserir e reagimos ao conflito real.
  const attempted = new Set<string>();
  let candidate = base;

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const { data, error } = await client
      .from("events")
      .insert({
        slug: candidate,
        title: input.title,
        kind: input.kind,
        event_at: input.date,
        venue: input.venue ?? null,
        city: input.city ?? null,
        hosts: input.hosts ?? null,
        host_profile_id: hostProfileId,
        // O evento nasce em rascunho: publicar é um ato deliberado.
        status: "rascunho",
      })
      .select(EVENT_SELECT)
      .single();

    if (!error) {
      const created = toEventSummary(data as unknown as EventRowWithContent);
      if (input.modules?.length) {
        await setEventModules(client, created.id, input.modules);
        return { ...created, modules: input.modules };
      }
      return created;
    }

    if (error.code !== UNIQUE_VIOLATION) {
      throw new DbError(error.message, "desconhecido");
    }

    // Slug escolhido pela pessoa: avisamos em vez de entregar outro endereço.
    if (explicitSlug) throw new SlugConflictError(explicitSlug);

    attempted.add(candidate);
    candidate = resolveSlugCollision(base, attempted);
  }

  throw new SlugConflictError(base);
}

export async function updateEvent(
  client: Client,
  eventId: string,
  input: UpdateEventInput,
): Promise<EventSummary> {
  const patch: Database["public"]["Tables"]["events"]["Update"] = {};

  if (input.title !== undefined) patch.title = input.title;
  if (input.date !== undefined) patch.event_at = input.date;
  if (input.venue !== undefined) patch.venue = input.venue;
  if (input.city !== undefined) patch.city = input.city;
  if (input.address !== undefined) patch.address = input.address;
  if (input.postalCode !== undefined) patch.postal_code = input.postalCode;
  if (input.hosts !== undefined) patch.hosts = input.hosts;
  if (input.eyebrow !== undefined) patch.eyebrow = input.eyebrow;
  if (input.welcome !== undefined) patch.welcome = input.welcome;
  if (input.themeKey !== undefined) patch.theme_key = input.themeKey;
  if (input.accentColor !== undefined) patch.accent_color = input.accentColor;
  if (input.accentTextColor !== undefined) patch.accent_text_color = input.accentTextColor;
  if (input.backgroundColor !== undefined) patch.background_color = input.backgroundColor;
  if (input.rsvpDeadline !== undefined) patch.rsvp_deadline = input.rsvpDeadline;
  if (input.sectionOrder !== undefined) patch.section_order = input.sectionOrder;
  if (input.moderationPolicy !== undefined) patch.moderation_policy = input.moderationPolicy;
  if (input.secretSantaBudget !== undefined) patch.secret_santa_budget = input.secretSantaBudget;
  if (input.secretSantaDrawDate !== undefined) patch.secret_santa_draw_date = input.secretSantaDrawDate;
  if (input.secretSantaExchangeDate !== undefined)
    patch.secret_santa_exchange_date = input.secretSantaExchangeDate;
  if (input.secretSantaRules !== undefined) patch.secret_santa_rules = input.secretSantaRules;
  if (input.barService !== undefined) patch.bar_service = input.barService;
  if (input.barSignatureName !== undefined) patch.bar_signature_name = input.barSignatureName;
  if (input.barSignatureDesc !== undefined) patch.bar_signature_desc = input.barSignatureDesc;

  const { data, error } = await client
    .from("events")
    .update(patch)
    .eq("id", eventId)
    .select(EVENT_SELECT)
    .maybeSingle();

  if (error) {
    if (error.code === CHECK_VIOLATION) {
      throw new DbError("O prazo de RSVP não pode estar no passado.", "invalido");
    }
    throw new DbError(error.message, "desconhecido");
  }
  // Sem linha de volta = a RLS recusou o update ou o evento não existe.
  if (!data) throw new DbError("Evento não encontrado.", "nao-encontrado");

  return toEventSummary(data as unknown as EventRowWithContent);
}

export async function setEventStatus(
  client: Client,
  eventId: string,
  status: Database["public"]["Enums"]["event_status"],
): Promise<EventSummary> {
  const { data, error } = await client
    .from("events")
    .update({ status })
    .eq("id", eventId)
    .select(EVENT_SELECT)
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) throw new DbError("Evento não encontrado.", "nao-encontrado");

  return toEventSummary(data as unknown as EventRowWithContent);
}

/**
 * Liga ou desliga o link de auto-cadastro do evento. Ligar gera um token novo
 * (chamar de novo com o link já ativo rotaciona o token — invalida o anterior);
 * desligar zera. A RLS de `events` escopa o update a quem administra o evento.
 */
export async function setSelfSignup(
  client: Client,
  eventId: string,
  active: boolean,
): Promise<EventSummary> {
  const token = active
    ? Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("")
    : null;

  const { data, error } = await client
    .from("events")
    .update({ self_signup_token: token })
    .eq("id", eventId)
    .select(EVENT_SELECT)
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) throw new DbError("Evento não encontrado.", "nao-encontrado");

  return toEventSummary(data as unknown as EventRowWithContent);
}

export async function setEventModules(
  client: Client,
  eventId: string,
  modules: ModuleId[],
): Promise<ModuleId[]> {
  // Remove primeiro o que saiu, depois adiciona o que entrou — nunca há um
  // instante em que o evento fica sem nenhum módulo, o que deixaria a página
  // pública momentaneamente vazia para quem estivesse navegando.
  const remove = client.from("event_modules").delete().eq("event_id", eventId);
  const { error: deleteError } = await (modules.length
    ? remove.not("module", "in", `(${modules.join(",")})`)
    : remove);

  if (deleteError) throw new DbError(deleteError.message, "desconhecido");

  if (modules.length) {
    const { error: insertError } = await client
      .from("event_modules")
      .upsert(
        modules.map((module) => ({ event_id: eventId, module })),
        { onConflict: "event_id,module", ignoreDuplicates: true },
      );

    if (insertError) throw new DbError(insertError.message, "desconhecido");
  }

  return modules;
}

/**
 * Define a capa do evento. `path` já vem prefixado por `{event_id}/` — quem
 * chama (a rota de confirmação de upload da capa) é responsável por montá-lo
 * assim; aqui só se confere que o prefixo bate com o evento, que é a defesa
 * contra "capa apontando para outro evento" já que a RLS de `events` não
 * enxerga o conteúdo de uma coluna `text`.
 */
export async function setEventCover(
  client: Client,
  eventId: string,
  path: string | null,
): Promise<EventSummary> {
  if (path !== null && !path.startsWith(`${eventId}/`)) {
    throw new DbError("A capa precisa pertencer a este evento.", "invalido");
  }

  const { data, error } = await client
    .from("events")
    .update({ cover_path: path })
    .eq("id", eventId)
    .select(EVENT_SELECT)
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) throw new DbError("Evento não encontrado.", "nao-encontrado");

  return toEventSummary(data as unknown as EventRowWithContent);
}

export async function replaceSchedule(
  client: Client,
  eventId: string,
  items: ScheduleItem[],
): Promise<ScheduleItem[]> {
  // A posição é o que define a ordem e tem unique por evento; reescrever a
  // lista inteira evita ter que calcular remanejamentos item a item.
  const { error: deleteError } = await client
    .from("schedule_items")
    .delete()
    .eq("event_id", eventId);

  if (deleteError) throw new DbError(deleteError.message, "desconhecido");

  if (items.length === 0) return [];

  const { error: insertError } = await client.from("schedule_items").insert(
    items.map((item, index) => ({
      event_id: eventId,
      position: index,
      time: item.time,
      title: item.title,
      description: item.desc || null,
    })),
  );

  if (insertError) throw new DbError(insertError.message, "desconhecido");

  return items;
}

/**
 * Reescreve o cardápio inteiro do evento. Mesma estratégia de `replaceSchedule`:
 * a posição define a ordem e tem unique por evento, então apagar tudo e
 * reinserir é mais simples que remanejar item a item.
 */
export async function replaceMenu(
  client: Client,
  eventId: string,
  items: MenuItem[],
): Promise<MenuItem[]> {
  const { error: deleteError } = await client
    .from("menu_items")
    .delete()
    .eq("event_id", eventId);

  if (deleteError) throw new DbError(deleteError.message, "desconhecido");

  if (items.length === 0) return [];

  const { error: insertError } = await client.from("menu_items").insert(
    items.map((item, index) => ({
      event_id: eventId,
      position: index,
      course: item.course,
      name: item.name,
      description: item.desc || null,
    })),
  );

  if (insertError) throw new DbError(insertError.message, "desconhecido");

  return items;
}

/** Reescreve a carta de bebidas do bar. Ver `replaceMenu`. */
export async function replaceBar(
  client: Client,
  eventId: string,
  items: BarItem[],
): Promise<BarItem[]> {
  const { error: deleteError } = await client
    .from("bar_items")
    .delete()
    .eq("event_id", eventId);

  if (deleteError) throw new DbError(deleteError.message, "desconhecido");

  if (items.length === 0) return [];

  const { error: insertError } = await client.from("bar_items").insert(
    items.map((item, index) => ({
      event_id: eventId,
      position: index,
      name: item.name,
      description: item.desc || null,
    })),
  );

  if (insertError) throw new DbError(insertError.message, "desconhecido");

  return items;
}
