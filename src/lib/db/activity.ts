import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Activity } from "@/lib/types";
import { DbError } from "./errors";

type Client = SupabaseClient<Database>;

/**
 * Feed de atividade real do evento: junta RSVP, presentes reservados/comprados,
 * fotos aprovadas e recados de mural num único feed ordenado por horário,
 * consultando as quatro tabelas em paralelo e mesclando na aplicação — nenhuma
 * delas por si só tem a ordem completa.
 */
export async function getRecentActivity(
  client: Client,
  eventId: string,
  limit = 8,
): Promise<Activity[]> {
  const perSource = limit;

  const [rsvps, reservations, photos, mural] = await Promise.all([
    client
      .from("guests")
      .select("id, name, status, responded_at, companions")
      .eq("event_id", eventId)
      .not("responded_at", "is", null)
      .order("responded_at", { ascending: false })
      .limit(perSource),
    client
      .from("gift_reservations")
      .select("id, buyer_name, status, created_at, gifts(name)")
      .eq("event_id", eventId)
      .in("status", ["ativa", "concluida"])
      .order("created_at", { ascending: false })
      .limit(perSource),
    client
      .from("photos")
      .select("id, author, created_at")
      .eq("event_id", eventId)
      .eq("status", "aprovada")
      .order("created_at", { ascending: false })
      .limit(perSource),
    client
      .from("mural_messages")
      .select("id, author, created_at")
      .eq("event_id", eventId)
      .eq("status", "aprovada")
      .order("created_at", { ascending: false })
      .limit(perSource),
  ]);

  if (rsvps.error) throw new DbError(rsvps.error.message, "desconhecido");
  if (reservations.error) throw new DbError(reservations.error.message, "desconhecido");
  if (photos.error) throw new DbError(photos.error.message, "desconhecido");
  if (mural.error) throw new DbError(mural.error.message, "desconhecido");

  const items: Activity[] = [
    ...(rsvps.data ?? []).map((g): Activity => ({
      id: `rsvp-${g.id}`,
      at: g.responded_at as string,
      who: g.name,
      what:
        g.status === "confirmado"
          ? g.companions > 0
            ? `confirmou presença (+${g.companions} acompanhante${g.companions > 1 ? "s" : ""})`
            : "confirmou presença"
          : "recusou o convite",
      kind: "rsvp",
    })),
    ...(reservations.data ?? []).map((r): Activity => ({
      id: `presente-${r.id}`,
      at: r.created_at,
      who: r.buyer_name,
      what: `${r.status === "concluida" ? "comprou" : "reservou"} "${
        (r.gifts as { name: string } | null)?.name ?? "um presente"
      }"`,
      kind: "presente",
    })),
    ...(photos.data ?? []).map((p): Activity => ({
      id: `foto-${p.id}`,
      at: p.created_at,
      who: p.author,
      what: "enviou uma foto para a galeria",
      kind: "foto",
    })),
    ...(mural.data ?? []).map((m): Activity => ({
      id: `mural-${m.id}`,
      at: m.created_at,
      who: m.author,
      what: "deixou um recado no mural",
      kind: "mural",
    })),
  ];

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
