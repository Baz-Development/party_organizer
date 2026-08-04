import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { emailEnv } from "@/lib/email/env";
import { processEmailQueue } from "@/lib/email/processQueue";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Rota interna chamada pelo `pg_cron` (`20260803180700_email_queue_cron.sql`)
 * a cada minuto, e também pelo `after()` best-effort logo após enfileirar.
 *
 * Não é um webhook de provedor externo — quem chama é o próprio banco (via
 * `pg_net`) ou o próprio processo Next.js. Autenticação por segredo
 * compartilhado em vez de assinatura, comparado em tempo constante (mesmo
 * raciocínio de `verifyWebhookSignature`). Sem o header correto, 401 sem
 * processar nada — nunca revela se o segredo estava perto de bater.
 */
export async function POST(req: Request) {
  const header = req.headers.get("x-email-queue-secret");
  if (!isValidSecret(header)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const result = await processEmailQueue(admin);

  return NextResponse.json({ data: result });
}

function isValidSecret(header: string | null): boolean {
  if (!header) return false;

  const expected = Buffer.from(emailEnv.EMAIL_QUEUE_CRON_SECRET, "utf8");
  const received = Buffer.from(header, "utf8");

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
