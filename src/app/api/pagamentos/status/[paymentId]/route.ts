import { NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/db/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Estado de um pagamento para a tela de sucesso do convidado.
 *
 * "Requirement: Confirmação exclusivamente por webhook assinado" — o retorno
 * do navegador não prova pagamento; esta rota é o que permite a tela dizer
 * "confirmação em processamento" em vez de assumir sucesso ao chegar aqui.
 * `paymentId` funciona como capability: só quem tem o `uuid` exato (devolvido
 * na resposta do checkout) consegue perguntar — RLS não entra em jogo porque
 * `get_payment_status` é `security definer`.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await params;

  const supabase = await createSupabaseServerClient();
  const status = await getPaymentStatus(supabase, paymentId);

  if (!status) {
    return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: status });
}
