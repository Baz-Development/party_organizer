import { NextResponse } from "next/server";
import type { Json } from "@/lib/database.types";
import { UNIQUE_VIOLATION } from "@/lib/db/errors";
import { paymentsEnv } from "@/lib/payments/env";
import { verifyWebhookSignature } from "@/lib/payments/webhookSignature";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Recebe a notificação de pagamento do provedor.
 *
 * Único ponto do projeto, fora de `src/lib/supabase/admin.ts`, autorizado a
 * instanciar o client `service_role` — e só depois de validar a assinatura,
 * porque quem chama aqui não é um usuário autenticado, é o provedor de
 * pagamento (design.md, decisão 6).
 *
 * "Requirement: Confirmação exclusivamente por webhook assinado": assinatura
 * ausente ou inválida é descartada sem alterar nenhum estado, mas o descarte
 * é registrado para auditoria. "Requirement: Idempotência do processamento de
 * notificações": a chave única `payment_events (provider, provider_event_id)`
 * garante que a segunda entrega do mesmo evento não chega a chamar
 * `process_payment_event` de novo — só é respondida como aceita.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-webhook-signature");
  const signatureValid = verifyWebhookSignature(rawBody, signatureHeader, paymentsEnv.PAYMENT_WEBHOOK_SECRET);

  const admin = createSupabaseAdminClient();

  if (!signatureValid) {
    const bestEffortPayload = parseJson(rawBody);
    await admin.from("payment_events").insert({
      payment_id: null,
      provider: (bestEffortPayload?.provider as string) ?? "desconhecido",
      provider_event_id: null,
      event_type: (bestEffortPayload?.type as string) ?? "desconhecido",
      payload: (bestEffortPayload as Json) ?? { raw: rawBody },
      signature_valid: false,
    });

    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const payload = parseJson(rawBody);
  if (!payload) {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const provider = typeof payload.provider === "string" ? payload.provider : "mock";
  const providerEventId = typeof payload.id === "string" ? payload.id : null;
  const eventType = typeof payload.type === "string" ? payload.type : "desconhecido";
  const data = (payload.data as Record<string, unknown> | undefined) ?? {};
  const paymentId = typeof data.payment_id === "string" ? data.payment_id : null;
  const providerPaymentId = typeof data.provider_payment_id === "string" ? data.provider_payment_id : null;
  const amountCents = typeof data.amount_cents === "number" ? data.amount_cents : null;

  const { data: eventRow, error: insertError } = await admin
    .from("payment_events")
    .insert({
      payment_id: paymentId,
      provider,
      provider_event_id: providerEventId,
      event_type: eventType,
      payload: payload as Json,
      signature_valid: true,
    })
    .select("id")
    .single();

  if (insertError) {
    // Reentrega do mesmo evento: a constraint única já viu esse
    // (provider, provider_event_id) e recusou a segunda linha — aceito sem
    // reprocessar, exatamente o que a spec pede para notificação duplicada.
    if (insertError.code === UNIQUE_VIOLATION) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (!paymentId) {
    return NextResponse.json({ received: true, applied: false, reason: "payment_id_ausente" });
  }

  const { data: result, error: rpcError } = await admin
    .rpc("process_payment_event", {
      p_payment_id: paymentId,
      p_provider_payment_id: providerPaymentId as string,
      p_event_type: eventType,
      p_amount_cents: amountCents as number,
    })
    .single();

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  await admin.from("payment_events").update({ processed_at: new Date().toISOString() }).eq("id", eventRow.id);

  return NextResponse.json({ received: true, applied: result.applied, reason: result.reason });
}

function parseJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
