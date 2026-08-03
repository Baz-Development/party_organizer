import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { MenuOption, MenuPoll } from "@/lib/types";
import { DbError, toMenuVoteError } from "./errors";

type Client = SupabaseClient<Database>;

/**
 * Acesso a enquetes de cardápio, opções e votos.
 *
 * `listMenuPolls`/`createMenuPoll`/`updateMenuPoll`/`deleteMenuPoll`/
 * `createMenuOption`/`deleteMenuOption` recebem o client autenticado de quem
 * administra o evento — a RLS de `menu_polls_manage`/`menu_options_manage`
 * escopa. `getMenuPollsForGuest`/`getMenuVotesByToken`/`submitMenuVote`
 * chamam as funções `security definer` via `client.rpc`, e por isso
 * funcionam também com o client anônimo do convidado sem conta.
 */

// --- Curadoria (anfitrião) --------------------------------------------

type MenuPollRow = Database["public"]["Tables"]["menu_polls"]["Row"];
type MenuOptionRow = Database["public"]["Tables"]["menu_options"]["Row"];

export interface MenuPollWithOptions {
  id: string;
  eventId: string;
  course: string;
  question: string;
  closesAt: string;
  maxChoices: number;
  options: { id: string; name: string; description: string; tags: string[] }[];
}

function toMenuPollWithOptions(
  row: MenuPollRow & { menu_options: MenuOptionRow[] },
): MenuPollWithOptions {
  return {
    id: row.id,
    eventId: row.event_id,
    course: row.course,
    question: row.question,
    closesAt: row.closes_at,
    maxChoices: row.max_choices,
    options: row.menu_options.map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description ?? "",
      tags: o.tags,
    })),
  };
}

export async function listMenuPolls(
  client: Client,
  eventId: string,
): Promise<MenuPollWithOptions[]> {
  const { data, error } = await client
    .from("menu_polls")
    .select("*, menu_options(*)")
    .eq("event_id", eventId)
    .order("created_at");

  if (error) throw new DbError(error.message, "desconhecido");

  return (data as (MenuPollRow & { menu_options: MenuOptionRow[] })[]).map(
    toMenuPollWithOptions,
  );
}

export interface CreateMenuOptionInput {
  name: string;
  description?: string;
  tags?: string[];
}

export interface CreateMenuPollInput {
  course: string;
  question: string;
  closesAt: string;
  maxChoices: number;
  options: CreateMenuOptionInput[];
}

export async function createMenuPoll(
  client: Client,
  eventId: string,
  input: CreateMenuPollInput,
): Promise<MenuPollWithOptions> {
  const { data: poll, error } = await client
    .from("menu_polls")
    .insert({
      event_id: eventId,
      course: input.course,
      question: input.question,
      closes_at: input.closesAt,
      max_choices: input.maxChoices,
    })
    .select("*")
    .single();

  if (error) throw new DbError(error.message, "desconhecido");

  const { data: options, error: optionsError } = await client
    .from("menu_options")
    .insert(
      input.options.map((o) => ({
        poll_id: poll.id,
        name: o.name,
        description: o.description ?? null,
        tags: o.tags ?? [],
      })),
    )
    .select("*");

  if (optionsError) {
    // A enquete já foi gravada; sem as opções ela não é válida — desfaz.
    await client.from("menu_polls").delete().eq("id", poll.id);
    throw new DbError(optionsError.message, "desconhecido");
  }

  return toMenuPollWithOptions({ ...poll, menu_options: options as MenuOptionRow[] });
}

export interface UpdateMenuPollInput {
  course?: string;
  question?: string;
  closesAt?: string;
  maxChoices?: number;
}

export async function updateMenuPoll(
  client: Client,
  pollId: string,
  input: UpdateMenuPollInput,
): Promise<MenuPollWithOptions> {
  const patch: Database["public"]["Tables"]["menu_polls"]["Update"] = {};
  if (input.course !== undefined) patch.course = input.course;
  if (input.question !== undefined) patch.question = input.question;
  if (input.closesAt !== undefined) patch.closes_at = input.closesAt;
  if (input.maxChoices !== undefined) patch.max_choices = input.maxChoices;

  const { data, error } = await client
    .from("menu_polls")
    .update(patch)
    .eq("id", pollId)
    .select("*, menu_options(*)")
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) throw new DbError("Enquete não encontrada.", "nao-encontrado");

  return toMenuPollWithOptions(data as MenuPollRow & { menu_options: MenuOptionRow[] });
}

export async function deleteMenuPoll(client: Client, pollId: string): Promise<void> {
  const { error, count } = await client
    .from("menu_polls")
    .delete({ count: "exact" })
    .eq("id", pollId);

  if (error) throw new DbError(error.message, "desconhecido");
  if (!count) throw new DbError("Enquete não encontrada.", "nao-encontrado");
}

export async function createMenuOption(
  client: Client,
  pollId: string,
  input: CreateMenuOptionInput,
): Promise<MenuPollWithOptions["options"][number]> {
  const { data, error } = await client
    .from("menu_options")
    .insert({
      poll_id: pollId,
      name: input.name,
      description: input.description ?? null,
      tags: input.tags ?? [],
    })
    .select("*")
    .single();

  if (error) throw new DbError(error.message, "desconhecido");

  return { id: data.id, name: data.name, description: data.description ?? "", tags: data.tags };
}

/**
 * Remove uma opção. Se ela já tiver voto, exige `force` — espelha a regra da
 * spec de que remover opção votada exige confirmação explícita.
 */
export async function deleteMenuOption(
  client: Client,
  optionId: string,
  options: { force?: boolean } = {},
): Promise<void> {
  if (!options.force) {
    const { count, error: countError } = await client
      .from("menu_votes")
      .select("id", { count: "exact", head: true })
      .eq("option_id", optionId);

    if (countError) throw new DbError(countError.message, "desconhecido");
    if (count) {
      throw new DbError(
        "Esta opção já recebeu votos. Confirme a remoção para continuar.",
        "conflito",
      );
    }
  }

  const { error, count } = await client
    .from("menu_options")
    .delete({ count: "exact" })
    .eq("id", optionId);

  if (error) throw new DbError(error.message, "desconhecido");
  if (!count) throw new DbError("Opção não encontrada.", "nao-encontrado");
}

// --- Convidado (via token) --------------------------------------------

export async function getMenuPollsForGuest(
  client: Client,
  eventSlug: string,
): Promise<MenuPoll[]> {
  const { data, error } = await client.rpc("get_menu_polls_publicos", {
    p_event_slug: eventSlug,
  });

  if (error) throw new DbError(error.message, "desconhecido");

  const polls = new Map<string, MenuPoll>();
  for (const row of data ?? []) {
    let poll = polls.get(row.poll_id);
    if (!poll) {
      poll = {
        id: row.poll_id,
        course: row.course,
        question: row.question,
        closesAt: row.closes_at,
        maxChoices: row.max_choices,
        options: [],
      };
      polls.set(row.poll_id, poll);
    }
    const option: MenuOption = {
      id: row.option_id,
      name: row.option_name,
      desc: row.option_desc ?? "",
      votes: Number(row.votes),
      tags: row.option_tags ?? [],
    };
    poll.options.push(option);
  }

  return [...polls.values()];
}

export async function getMenuVotesByToken(
  client: Client,
  token: string,
): Promise<Record<string, string[]>> {
  const { data, error } = await client.rpc("get_menu_votes_by_token", { p_token: token });

  if (error) throw new DbError(error.message, "desconhecido");

  const votes: Record<string, string[]> = {};
  for (const row of data ?? []) {
    (votes[row.poll_id] ??= []).push(row.option_id);
  }
  return votes;
}

export async function submitMenuVote(
  client: Client,
  token: string,
  pollId: string,
  optionIds: string[],
): Promise<string[]> {
  const { data, error } = await client.rpc("submit_menu_vote", {
    p_token: token,
    p_poll_id: pollId,
    p_option_ids: optionIds,
  });

  if (error) throw toMenuVoteError(error);

  return data ?? [];
}
