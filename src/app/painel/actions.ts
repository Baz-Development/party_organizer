"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { DbError } from "@/lib/db/errors";
import { setEventStatus } from "@/lib/db/events";
import { eventStatusSchema } from "@/lib/validation/event";

const payloadSchema = z.object({
  eventId: z.uuid(),
  // Só o par publicar/despublicar é decisão do cliente. "encerrado" é ação
  // administrativa e não passa por aqui.
  status: eventStatusSchema.refine(
    (value) => value === "publicado" || value === "rascunho",
    "Estado não permitido pelo painel.",
  ),
});

export type AlterarStatusPayload = z.input<typeof payloadSchema>;

export type AlterarStatusResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Publica ou volta para rascunho a página do evento. Publicar é o que torna o
 * link do convite visível para quem não administra o evento (RLS
 * `events_public_read` em `20260803120800_rls_events.sql`).
 *
 * Não confere dono aqui — a RLS de `events_update` escopa o update a quem
 * administra o evento; `setEventStatus` volta sem linha quando a política
 * recusa, e isso vira "não encontrado".
 */
export async function alterarStatusEvento(
  input: AlterarStatusPayload,
): Promise<AlterarStatusResult> {
  const { supabase } = await requireSession("/painel");

  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Dados inválidos." };
  }

  const { eventId, status } = parsed.data;

  try {
    await setEventStatus(supabase, eventId, status);
  } catch (error) {
    if (error instanceof DbError) {
      return {
        ok: false,
        message:
          error.kind === "nao-encontrado"
            ? "Você não tem permissão para editar este evento."
            : error.message,
      };
    }
    throw error;
  }

  revalidatePath("/painel");
  revalidatePath("/painel/editor");
  revalidatePath("/[id]/[slug]", "page");

  return { ok: true };
}
