import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { DbError } from "./errors";

type Client = SupabaseClient<Database>;

const MONTH_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/**
 * Série real para o gráfico "Novos eventos por mês" do painel admin: conta
 * `events.created_at` por mês, dos últimos `months` (incluindo o atual). Só o
 * admin chega aqui — a RLS de `events` abre tudo para `is_platform_admin()`,
 * então a contagem não precisa filtrar por dono.
 */
export async function getEventsPerMonth(
  client: Client,
  months = 7,
): Promise<{ label: string; value: number }[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const { data, error } = await client
    .from("events")
    .select("created_at")
    .gte("created_at", start.toISOString());

  if (error) throw new DbError(error.message, "desconhecido");

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }

  for (const row of data ?? []) {
    const d = new Date(row.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([key, value]) => {
    const [, monthStr] = key.split("-");
    return { label: MONTH_LABEL[Number(monthStr)], value };
  });
}

/** Convidados cadastrados neste mês, somando todos os eventos — mesma lógica de escopo. */
export async function getGuestsThisMonth(client: Client): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await client
    .from("guests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", start);

  if (error) throw new DbError(error.message, "desconhecido");
  return count ?? 0;
}
