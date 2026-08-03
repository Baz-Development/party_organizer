import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env.public";

/**
 * Cliente do Supabase para Server Components, Route Handlers e Server Actions.
 *
 * Usa a chave anônima e a sessão do usuário vinda dos cookies — ou seja, toda
 * consulta feita por aqui passa pela RLS. É o cliente padrão: só recorra ao
 * `admin.ts` quando a operação genuinamente não tiver sessão.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components não podem gravar cookies (o HTTP não permite
            // depois que o streaming começou). Ignorar é seguro: quem renova a
            // sessão é o proxy, que roda antes da renderização.
          }
        },
      },
    },
  );
}

/**
 * Usuário autenticado da requisição, ou `null`.
 *
 * Sempre `getUser()`, nunca `getSession()`: `getUser()` valida o token contra
 * o servidor do Auth, enquanto a sessão do cookie é apenas o que o navegador
 * mandou e pode ter sido adulterada.
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
