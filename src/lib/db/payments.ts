import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { toGiftCheckoutError, DbError } from "./errors";
import { centsToReais } from "./mappers";

type Client = SupabaseClient<Database>;

/**
 * Acesso ao checkout de presentes, do lado do convidado (sem conta).
 *
 * `start_gift_checkout`/`attach_checkout_session`/`get_payment_status` são
 * `security definer` — funcionam com o client anônimo porque o `uuid` do
 * pagamento é a capability (design.md, decisão 5). Nunca usam client de
 * serviço: o convidado sem conta não precisa dele para nada neste arquivo.
 */

export interface StartCheckoutInput {
  buyerName: string;
  buyerEmail?: string;
  /** Só relevante para presente de cota — ignorado pelo servidor para presente simples. */
  amountCents?: number;
}

export interface CheckoutStarted {
  paymentId: string;
  giftId: string;
  amountCents: number;
  currency: string;
  reservationExpiresAt?: string;
}

export async function startGiftCheckout(
  client: Client,
  eventSlug: string,
  giftId: string,
  input: StartCheckoutInput,
): Promise<CheckoutStarted> {
  const { data, error } = await client
    .rpc("start_gift_checkout", {
      p_event_slug: eventSlug,
      p_gift_id: giftId,
      p_amount_cents: (input.amountCents ?? null) as number,
      p_buyer_name: input.buyerName,
      p_buyer_email: (input.buyerEmail ?? null) as string,
    })
    .single();

  if (error) throw toGiftCheckoutError(error);

  return {
    paymentId: data.payment_id,
    giftId: data.gift_id,
    amountCents: data.amount_cents,
    currency: data.currency,
    reservationExpiresAt: data.reservation_expires_at ?? undefined,
  };
}

export async function attachCheckoutSession(
  client: Client,
  paymentId: string,
  provider: string,
  providerPaymentId: string,
): Promise<void> {
  const { error } = await client.rpc("attach_checkout_session", {
    p_payment_id: paymentId,
    p_provider: provider,
    p_provider_payment_id: providerPaymentId,
  });

  if (error) throw toGiftCheckoutError(error);
}

export interface PaymentStatus {
  paymentId: string;
  status: Database["public"]["Enums"]["payment_status"];
  amount: number;
  currency: string;
  giftId: string;
  giftName: string;
  giftStatus: Database["public"]["Enums"]["gift_status"];
}

export async function getPaymentStatus(client: Client, paymentId: string): Promise<PaymentStatus | null> {
  const { data, error } = await client.rpc("get_payment_status", { p_payment_id: paymentId }).maybeSingle();

  if (error) throw new DbError(error.message, "desconhecido");
  if (!data) return null;

  return {
    paymentId: data.payment_id,
    status: data.status,
    amount: centsToReais(data.amount_cents),
    currency: data.currency,
    giftId: data.gift_id,
    giftName: data.gift_name,
    giftStatus: data.gift_status,
  };
}
