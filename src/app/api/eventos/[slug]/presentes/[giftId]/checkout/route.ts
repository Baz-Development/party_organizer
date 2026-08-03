import { NextResponse } from "next/server";
import { GiftCheckoutError } from "@/lib/db/errors";
import { attachCheckoutSession, startGiftCheckout } from "@/lib/db/payments";
import { paymentProvider } from "@/lib/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { startGiftCheckoutSchema } from "@/lib/validation/gift";

/**
 * Inicia o checkout de um presente — reserva (presente simples) ou
 * contribuição (cota) e a sessão do provedor de pagamento.
 *
 * O valor é sempre calculado no servidor: `start_gift_checkout` ignora
 * qualquer preço vindo do cliente para presente simples, e trava a linha do
 * presente antes de aceitar um valor de contribuição de cota
 * ("Requirement: Checkout com valor determinado pelo servidor"). Não há
 * checagem de posse aqui — o evento nem precisa ser resolvido por slug antes:
 * a própria função de banco valida que o evento está publicado e o módulo
 * habilitado, porque é o convidado sem conta quem chama, com o client
 * anônimo.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; giftId: string }> },
) {
  const { slug, giftId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = startGiftCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const checkout = await startGiftCheckout(supabase, slug, giftId, {
      buyerName: parsed.data.buyerName,
      buyerEmail: parsed.data.buyerEmail || undefined,
      amountCents: parsed.data.amount,
    });

    const session = await paymentProvider.createCheckoutSession({
      paymentId: checkout.paymentId,
      amountCents: checkout.amountCents,
      currency: checkout.currency,
      description: `Presente — evento ${slug}`,
    });

    await attachCheckoutSession(supabase, checkout.paymentId, "mock", session.providerPaymentId);

    return NextResponse.json(
      {
        data: {
          paymentId: checkout.paymentId,
          amount: checkout.amountCents / 100,
          currency: checkout.currency,
          checkoutUrl: session.checkoutUrl,
          reservationExpiresAt: checkout.reservationExpiresAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof GiftCheckoutError) {
      const conflictCodes = new Set(["presente_indisponivel", "presente_reservado"]);
      const status = conflictCodes.has(error.code) ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
