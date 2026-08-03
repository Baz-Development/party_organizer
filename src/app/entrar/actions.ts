"use server";

import { z } from "zod";
import { safeNextPath } from "@/lib/auth/redirect";
import { publicEnv } from "@/lib/env.public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EntrarState =
  | { status: "idle" }
  | { status: "enviado"; email: string }
  | { status: "erro"; message: string };

const emailSchema = z.email("Informe um e-mail válido.");

/**
 * Dispara o link mágico.
 *
 * Responde exatamente a mesma coisa para e-mail com conta e sem conta: se a
 * resposta variasse, a tela viraria um oráculo para descobrir quem é cliente
 * da plataforma. Falha de envio é registrada no servidor, não contada a quem
 * pediu.
 */
export async function enviarLinkMagico(
  _previous: EntrarState,
  formData: FormData,
): Promise<EntrarState> {
  const email = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );

  if (!email.success) {
    return { status: "erro", message: "Informe um e-mail válido." };
  }

  const next = safeNextPath(formData.get("next")?.toString());
  const callback = new URL("/api/auth/callback", publicEnv.NEXT_PUBLIC_SITE_URL);
  callback.searchParams.set("next", next);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: callback.toString() },
  });

  if (error) {
    console.error("[entrar] falha ao enviar link mágico:", error.message);
  }

  return { status: "enviado", email: email.data };
}
