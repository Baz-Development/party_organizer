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
 *     banco (a tabela de tokens chega no change `add-guests-rsvp-backend`).
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
