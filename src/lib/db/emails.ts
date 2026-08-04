import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { DbError } from "./errors";

type Client = SupabaseClient<Database>;

/**
 * Histórico de envio para a tela de acompanhamento em `/painel/convidados`.
 * Recebe o client autenticado de quem administra o evento — a RLS de
 * `email_messages_manage_read` escopa (`20260803180400_rls_email.sql`).
 */
export interface EmailHistoryEntry {
  id: string;
  recipientEmail: string;
  template: Database["public"]["Enums"]["email_template"];
  status: Database["public"]["Enums"]["email_status"];
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listEmailHistory(client: Client, eventId: string): Promise<EmailHistoryEntry[]> {
  const { data, error } = await client
    .from("email_messages")
    .select("id, recipient_email, template, status, last_error, created_at, updated_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw new DbError(error.message, "desconhecido");

  return (data ?? []).map((row) => ({
    id: row.id,
    recipientEmail: row.recipient_email,
    template: row.template,
    status: row.status,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
