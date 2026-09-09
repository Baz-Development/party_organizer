import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { serverEnv } from "@/lib/env";
import { publicEnv } from "@/lib/env.public";

/**
 * Cliente com a chave `service-role`. **Ignora a RLS por completo.**
 *
 * Este é o único módulo do projeto autorizado a ler
 * `SUPABASE_SERVICE_ROLE_KEY`. O `import "server-only"` acima faz qualquer
 * import a partir de um Client Component virar erro de build, e é isso que
 * impede a chave de entrar no bundle do navegador.
 *
 * Usos legítimos, cada um justificado no ponto de uso:
 *   - seed e jobs administrativos, que rodam sem sessão;
 *   - resolver um token de convite de convidado, que não tem identidade no
 *     banco (a tabela de tokens chega no change `add-guests-rsvp-backend`);
 *   - emitir URL de upload assinada para os buckets de Storage
 *     (`add-media-storage-backend`): `guest-uploads` não tem política de
 *     `insert` para `anon`/`authenticated` de propósito, então só o servidor
 *     consegue criar a URL — a checagem de "pode enviar" roda antes, com o
 *     client de quem chamou.
 *
 * Qualquer novo import daqui derruba a garantia da RLS para aquele caminho e
 * exige revisão. Na dúvida, use `createSupabaseServerClient()`.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // Sem sessão: este cliente nunca representa um usuário, então não há
        // token para persistir nem renovar.
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export type InviteClientResult =
  | { ok: true }
  | { ok: false; reason: "conflito" | "desconhecido"; message: string };

/**
 * Provisiona uma conta de cliente, sem disparar e-mail nenhum.
 *
 * `createUser` cria a linha em `auth.users` já confirmada (login por magic
 * link não depende de confirmação por e-mail) e faz o trigger
 * `handle_new_user` nascer o perfil como `provisioned`. O nome vai em
 * `raw_user_meta_data.display_name`, de onde o trigger também o lê.
 *
 * O convite por e-mail só é disparado depois, quando a primeira página do
 * cliente é criada (`enqueueEmail` com o modelo `acesso_painel` em
 * `POST /api/eventos`) — cadastrar a conta sozinha não avisa ninguém.
 */
export async function createClientAccount(
  email: string,
  displayName: string,
): Promise<InviteClientResult> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (!error) return { ok: true };

  // O GoTrue responde 422 quando o e-mail já pertence a um usuário.
  const alreadyRegistered =
    error.status === 422 || /already been registered|already exists/i.test(error.message);

  return {
    ok: false,
    reason: alreadyRegistered ? "conflito" : "desconhecido",
    message: alreadyRegistered
      ? "Já existe uma conta com esse e-mail."
      : "Não foi possível cadastrar o cliente.",
  };
}

/**
 * E-mail de uma conta de cliente pelo id do perfil (== id em `auth.users`).
 * Usado para enfileirar o `acesso_painel` na criação da primeira página —
 * `profiles` não guarda e-mail, só `auth.users`.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}
