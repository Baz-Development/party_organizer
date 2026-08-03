import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Organization, OrganizationMember } from "@/lib/types";
import type {
  AddMemberInput,
  CreateOrganizationInput,
} from "@/lib/validation/organization";
import { DbError } from "./errors";
import { toOrganization, toOrganizationMember } from "./mappers";

type Client = SupabaseClient<Database>;

/**
 * Acesso a organizações.
 *
 * A RLS já escopa tudo: `listOrganizations` sem filtro devolve apenas as
 * organizações a que o usuário pertence — e todas, para um admin.
 */

/** Métricas do painel: total de eventos e quantos estão ativos. */
type Counts = Map<string, { events: number; activeEvents: number }>;

export async function listOrganizations(client: Client): Promise<Organization[]> {
  const { data, error } = await client
    .from("organizations")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new DbError(error.message, "desconhecido");

  const counts = await countEventsByOrganization(
    client,
    data.map((org) => org.id),
  );

  return data.map((org) =>
    toOrganization(org, counts.get(org.id) ?? { events: 0, activeEvents: 0 }),
  );
}

export async function getOrganization(
  client: Client,
  organizationId: string,
): Promise<Organization | null> {
  const { data, error } = await client
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) return null;

  const counts = await countEventsByOrganization(client, [data.id]);
  return toOrganization(data, counts.get(data.id) ?? { events: 0, activeEvents: 0 });
}

export async function createOrganization(
  client: Client,
  input: CreateOrganizationInput,
): Promise<Organization> {
  const { data, error } = await client
    .from("organizations")
    .insert({
      name: input.name,
      plan: input.plan,
      city: input.city ?? null,
      contact: input.contact ?? null,
      ...(input.since ? { since: input.since } : {}),
    })
    .select("*")
    .single();

  if (error) throw new DbError(error.message, "desconhecido");

  return toOrganization(data, { events: 0, activeEvents: 0 });
}

export async function listMembers(
  client: Client,
  organizationId: string,
): Promise<OrganizationMember[]> {
  const { data, error } = await client
    .from("organization_members")
    .select("organization_id, profile_id, role, profiles ( email, display_name )")
    .eq("organization_id", organizationId);

  if (error) throw new DbError(error.message, "desconhecido");

  return (data as unknown as Parameters<typeof toOrganizationMember>[0][]).map(
    toOrganizationMember,
  );
}

/**
 * Adiciona um membro pelo e-mail.
 *
 * Exige que a pessoa já tenha perfil: convidar quem nunca entrou depende de
 * uma tabela de convites pendentes, que não pertence a esta fundação.
 */
export async function addMember(
  client: Client,
  organizationId: string,
  input: AddMemberInput,
): Promise<OrganizationMember> {
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, email, display_name")
    .eq("email", input.email)
    .maybeSingle();

  if (profileError) throw new DbError(profileError.message, "desconhecido");
  if (!profile) {
    throw new DbError(
      `Nenhum perfil encontrado para ${input.email}. Peça que a pessoa entre uma vez antes de adicioná-la.`,
      "nao-encontrado",
    );
  }

  const { data, error } = await client
    .from("organization_members")
    .upsert(
      { organization_id: organizationId, profile_id: profile.id, role: input.role },
      { onConflict: "organization_id,profile_id" },
    )
    .select("organization_id, profile_id, role, profiles ( email, display_name )")
    .single();

  if (error) throw new DbError(error.message, "desconhecido");

  return toOrganizationMember(data as unknown as Parameters<typeof toOrganizationMember>[0]);
}

/**
 * Remove um membro.
 *
 * Remover o último proprietário é recusado pelo banco (trigger
 * `organization_members_keep_owner`), não por checagem aqui: assim a regra
 * vale para qualquer caminho que toque a tabela, inclusive um job.
 */
export async function removeMember(
  client: Client,
  organizationId: string,
  profileId: string,
): Promise<void> {
  const { error } = await client
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("profile_id", profileId);

  if (error) {
    const semProprietario = error.message.includes("sem proprietário");
    throw new DbError(
      semProprietario
        ? "A organização precisa manter ao menos um proprietário."
        : error.message,
      semProprietario ? "invalido" : "desconhecido",
    );
  }
}

/**
 * Conta eventos por organização em uma consulta só.
 *
 * O Postgrest não agrupa, então trazemos apenas `organization_id` e `status` —
 * duas colunas curtas — e contamos em memória. Vira um `group by` no banco se
 * o volume justificar.
 */
async function countEventsByOrganization(
  client: Client,
  organizationIds: string[],
): Promise<Counts> {
  const counts: Counts = new Map();
  if (organizationIds.length === 0) return counts;

  const { data, error } = await client
    .from("events")
    .select("organization_id, status")
    .in("organization_id", organizationIds);

  if (error) throw new DbError(error.message, "desconhecido");

  for (const row of data) {
    if (!row.organization_id) continue;

    const entry = counts.get(row.organization_id) ?? { events: 0, activeEvents: 0 };
    entry.events += 1;
    // "Ativo" = publicado. Rascunho ainda não existe para o convidado e
    // encerrado já passou.
    if (row.status === "publicado") entry.activeEvents += 1;
    counts.set(row.organization_id, entry);
  }

  return counts;
}
