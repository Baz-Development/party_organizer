import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/env.public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Encerra a sessão.
 *
 * `signOut()` revoga o refresh token no servidor do Auth — não basta apagar o
 * cookie, senão o token continuaria válido para quem tivesse copiado. O
 * cliente do `@supabase/ssr` limpa os cookies da resposta como parte da
 * operação.
 *
 * Só POST: um GET seria disparado por prefetch de link ou por uma imagem
 * apontando para cá, derrubando a sessão sem a pessoa pedir.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth/sair] falha ao encerrar sessão:", error.message);
  }

  return NextResponse.redirect(new URL("/entrar", publicEnv.NEXT_PUBLIC_SITE_URL), {
    // 303: o navegador troca o POST por um GET ao seguir o redirect.
    status: 303,
  });
}
