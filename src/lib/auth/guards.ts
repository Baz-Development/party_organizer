import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { forbidden, redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { getProfile } from "@/lib/db/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { loginPathFor } from "./redirect";

/**
 * Guardas das áreas autenticadas.
 *
 * A decisão de acesso mora aqui, em layouts de servidor — e não no proxy.
 * Um matcher de proxy que deixe de cobrir uma rota removeria a proteção sem
 * ninguém perceber; um layout protege tudo que está abaixo dele por
 * construção. A RLS do banco é a rede de segurança se algo escapar mesmo
 * assim.
 */

export interface Sessao {
  supabase: SupabaseClient<Database>;
  user: User;
  profile: Profile;
}

/** Exige sessão válida. Sem sessão, leva ao login preservando o destino. */
export async function requireSession(pathname: string): Promise<Sessao> {
  const supabase = await createSupabaseServerClient();

  // `getUser()` valida o token contra o servidor do Auth. Ler a sessão do
  // cookie diretamente aceitaria um token forjado.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(loginPathFor(pathname));

  const profile = await getProfile(supabase, user.id);
  if (!profile) redirect(loginPathFor(pathname));

  return { supabase, user, profile };
}

/** Exige papel de admin da plataforma. */
export async function requireAdmin(pathname: string): Promise<Sessao> {
  const session = await requireSession(pathname);

  // 403, não redirect: quem já está autenticado não resolve nada entrando de
  // novo, e nenhum dado da rota chega a ser buscado.
  if (session.profile.role !== "admin") forbidden();

  return session;
}
