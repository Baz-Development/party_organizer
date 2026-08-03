"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { replaceSchedule, setEventModules, updateEvent } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import {
  eventModulesSchema,
  eventScheduleSchema,
  updateEventSchema,
} from "@/lib/validation/event";

const payloadSchema = z.object({
  eventId: z.uuid(),
  content: updateEventSchema,
  modules: eventModulesSchema,
  schedule: eventScheduleSchema,
});

export type EditorPayload = z.input<typeof payloadSchema>;

export type EditorResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Salva o que o editor da página controla: conteúdo editorial, tema, módulos
 * habilitados e cronograma.
 *
 * Não confere se o usuário é dono do evento — a RLS confere. `updateEvent`
 * volta sem linha quando a política recusa, e isso vira "não encontrado".
 * Duplicar a checagem aqui daria a falsa impressão de que ela é o que protege.
 */
export async function salvarEditor(input: EditorPayload): Promise<EditorResult> {
  const { supabase } = await requireSession("/painel/editor");

  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Dados inválidos." };
  }

  const { eventId, content, modules, schedule } = parsed.data;

  try {
    await updateEvent(supabase, eventId, content);
    await setEventModules(supabase, eventId, modules);
    await replaceSchedule(supabase, eventId, schedule);
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

  // A página pública do evento e o painel mostram o que acabou de mudar.
  revalidatePath("/painel");
  revalidatePath("/painel/editor");

  return { ok: true };
}
