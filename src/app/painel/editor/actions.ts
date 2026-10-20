"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import {
  replaceBar,
  replaceMenu,
  replaceSchedule,
  setEventModules,
  updateEvent,
} from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import {
  eventBarSchema,
  eventMenuSchema,
  eventModulesSchema,
  eventScheduleSchema,
  updateEventSchema,
} from "@/lib/validation/event";

const payloadSchema = z.object({
  eventId: z.uuid(),
  content: updateEventSchema,
  modules: eventModulesSchema,
  schedule: eventScheduleSchema,
  menu: eventMenuSchema,
  bar: eventBarSchema,
});

export type EditorPayload = z.input<typeof payloadSchema>;

export type EditorResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Salva o que o editor da página controla: conteúdo editorial, tema, módulos
 * habilitados, cronograma, cardápio e bar.
 *
 * Tema/cores e módulos são do admin: para a anfitriã eles são descartados
 * aqui, e o banco recusa de todo jeito (RLS de `event_modules` e trigger de
 * `events`) — descartar só evita um erro por um campo que ela nem vê.
 *
 * Não confere se o usuário é dono do evento — a RLS confere. `updateEvent`
 * volta sem linha quando a política recusa, e isso vira "não encontrado".
 * Duplicar a checagem aqui daria a falsa impressão de que ela é o que protege.
 */
export async function salvarEditor(input: EditorPayload): Promise<EditorResult> {
  const { supabase, profile } = await requireSession("/painel/editor");
  const isAdmin = profile.role === "admin";

  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Dados inválidos." };
  }

  const { eventId, modules, schedule, menu, bar } = parsed.data;
  const content = isAdmin ? parsed.data.content : withoutLayout(parsed.data.content);

  try {
    await updateEvent(supabase, eventId, content);
    if (isAdmin) await setEventModules(supabase, eventId, modules);
    await replaceSchedule(supabase, eventId, schedule);
    await replaceMenu(supabase, eventId, menu);
    await replaceBar(supabase, eventId, bar);
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
  revalidatePath("/[id]/[slug]", "page");
  revalidatePath("/[id]/[slug]/rsvp", "page");

  return { ok: true };
}

/**
 * Conteúdo sem os campos de identidade visual, que só o admin altera.
 * `updateEvent` ignora campos `undefined`, então as colunas ficam intactas.
 */
function withoutLayout(content: z.output<typeof updateEventSchema>) {
  return {
    ...content,
    themeKey: undefined,
    accentColor: undefined,
    accentTextColor: undefined,
    backgroundColor: undefined,
  };
}
