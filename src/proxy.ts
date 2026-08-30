import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env.public";

/**
 * Renova a sessão do Supabase a cada navegação — e **nada além disso**.
 *
 * Nenhuma decisão de autorização mora aqui. Um matcher que deixe de cobrir uma
 * rota, ou uma Server Function movida de arquivo, removeria a proteção em
 * silêncio. Quem decide acesso são os layouts de servidor de `/painel` e
 * `/admin`, com a RLS do banco como última linha de defesa.
 *
 * Em Next.js 16 o arquivo se chama `proxy.ts` e a função exportada, `proxy`
 * (o antigo `middleware` foi renomeado).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Os cookies renovados precisam ir para dois lugares: a requisição,
          // para que a renderização adiante já use o token novo, e a resposta,
          // para que o navegador o guarde.
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // `getUser()` valida o token contra o servidor do Auth e, de quebra, dispara
  // a renovação quando ele está perto de expirar. É a única razão do proxy.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Todas as rotas, exceto arquivos estáticos e imagens otimizadas —
     * renovar sessão num .svg é desperdício de invocação.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
