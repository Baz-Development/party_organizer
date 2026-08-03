"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/guards";
import { createEvent } from "@/lib/db/events";
import { DbError } from "@/lib/db/errors";
import { listMembershipIds } from "@/lib/db/profiles";
import { createEventSchema } from "@/lib/validation/event";

export type CriarEventoResult =
  | { ok: true; slug: string }
  | { ok: false; message: string };

/**
 * Cria o evento do onboarding.
 *
 * O evento nasce em rascunho (é o default da tabela) e com o usuário como
 * anfitrião. O slug sai do título — o onboarding não pergunta endereço.
 *
 * Vínculo com organização: se quem está criando já é membro de exatamente uma
 * organização, o evento entra no portfólio dela. Mais de uma seria adivinhação,
 * e cadastrar organização nova é ato de admin, não deste fluxo.
 */
export async function criarEvento(input: unknown): Promise<CriarEventoResult> {
  const { supabase, user } = await requireSession("/onboarding");

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Dados inválidos." };
  }

  const memberships = await listMembershipIds(supabase, user.id);
  const organizationId =
    memberships.length === 1 ? memberships[0] : parsed.data.organizationId;

  try {
    const event = await createEvent(
      supabase,
      { ...parsed.data, organizationId },
      user.id,
    );

    revalidatePath("/painel");
    return { ok: true, slug: event.slug };
  } catch (error) {
    if (error instanceof DbError) return { ok: false, message: error.message };
    throw error;
  }
}
