import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNextPath } from "@/lib/auth/redirect";
import { publicEnv } from "@/lib/env.public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Ponto de retorno do link mágico: troca o código de uso único por uma sessão
 * e grava os cookies.
 *
 * O destino vem do parâmetro `next`, que chega de fora e por isso é reduzido a
 * um caminho relativo antes de virar redirect — caso contrário a tela de login
 * viraria um open redirect.
 *
 * Redirecionamos sempre para `NEXT_PUBLIC_SITE_URL`, não para o host da
 * requisição: atrás de um proxy o `Host` pode ser reescrito, e a origem
 * canônica do ambiente é a que está no `.env`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const site = publicEnv.NEXT_PUBLIC_SITE_URL;
  const next = safeNextPath(searchParams.get("next"));

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createSupabaseServerClient();

  // Fluxo PKCE (padrão do @supabase/ssr).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, site));
    console.error("[auth/callback] troca de código falhou:", error.message);
  }
  // Fluxo de token no link, usado por alguns templates de e-mail.
  else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, site));
    console.error("[auth/callback] verificação de token falhou:", error.message);
  }

  // Link expirado, já consumido ou adulterado: nenhuma sessão é criada.
  return NextResponse.redirect(new URL("/entrar?erro=link-invalido", site));
}
