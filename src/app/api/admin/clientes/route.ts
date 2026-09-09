import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { listClientAccounts } from "@/lib/db/clients";
import { DbError } from "@/lib/db/errors";
import { createClientAccount } from "@/lib/supabase/admin";
import { inviteClientSchema } from "@/lib/validation/client";

/**
 * Contas de cliente da plataforma. Só o admin cadastra e lista — o cliente que
 * bater aqui recebe 403 e nenhum dado.
 */
export async function GET() {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  try {
    const clientes = await listClientAccounts(guard.supabase);
    return NextResponse.json({ data: clientes });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: "Não foi possível listar os clientes." }, { status: 500 });
    }
    throw error;
  }
}

export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = inviteClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const result = await createClientAccount(parsed.data.email, parsed.data.displayName);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.reason === "conflito" ? 409 : 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
