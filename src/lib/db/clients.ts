import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { DbError } from "./errors";

type Client = SupabaseClient<Database>;

export interface ClientAccount {
  id: string;
  email: string;
  displayName: string;
  createdAt: string | null;
  eventCount: number;
  /** "aguardando" primeiro acesso ou "ativa" (já entrou pelo menos uma vez). */
  status: "aguardando" | "ativa";
}

/**
 * Contas de cliente para o painel de admin.
 *
 * Passa por `list_client_accounts()`, uma função `security definer` que só
 * responde para `is_platform_admin()` — a view por trás dela é inacessível a
 * `anon`/`authenticated` porque junta `auth.users`.
 */
export async function listClientAccounts(client: Client): Promise<ClientAccount[]> {
  const { data, error } = await client.rpc("list_client_accounts");
  if (error) throw new DbError(error.message, "desconhecido");

  return (data ?? []).map((row) => ({
    id: row.id ?? "",
    email: row.email ?? "",
    displayName: row.display_name ?? row.email ?? "",
    createdAt: row.created_at,
    eventCount: row.event_count ?? 0,
    status: row.last_sign_in_at ? "ativa" : "aguardando",
  }));
}
