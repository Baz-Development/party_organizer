import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Profile } from "@/lib/types";
import { DbError } from "./errors";
import { toProfile } from "./mappers";

type Client = SupabaseClient<Database>;

export async function getProfile(
  client: Client,
  profileId: string,
): Promise<Profile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");

  return data ? toProfile(data) : null;
}

/**
 * Atualiza o perfil.
 *
 * `role` não faz parte da entrada de propósito: promover alguém a admin não é
 * um fluxo da aplicação. Mesmo que passasse por aqui, o trigger
 * `profiles_protect_role` recusaria a alteração no banco.
 */
export async function updateProfile(
  client: Client,
  profileId: string,
  input: { displayName?: string },
): Promise<Profile> {
  const { data, error } = await client
    .from("profiles")
    .update({ display_name: input.displayName })
    .eq("id", profileId)
    .select("*")
    .maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  // Sem linha de volta = a RLS recusou: é o perfil de outra pessoa.
  if (!data) throw new DbError("Perfil não encontrado.", "nao-encontrado");

  return toProfile(data);
}
