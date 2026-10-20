import { NextResponse } from "next/server";
import type { z } from "zod";
import { getEventBySlug } from "@/lib/db/events";
import { DbError, RaffleError } from "@/lib/db/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventSummary } from "@/lib/types";

/**
 * Peças comuns às rotas de `/api/eventos/[slug]/sorteios/**`. Não é uma rota
 * (só `route.ts` vira endpoint) — fica aqui por ser usada só por elas.
 */

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Resolve o evento da rota com o client de quem está logado. Evento invisível
 * pela RLS vira 404, igual às outras rotas; módulo desligado vira 403.
 */
export async function loadRaffleEvent(
  slug: string,
): Promise<{ supabase: Supabase; event: EventSummary } | NextResponse> {
  const supabase = await createSupabaseServerClient();
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }
  if (!event.modules.includes("sorteios")) {
    return NextResponse.json(
      { error: "Os sorteios não estão habilitados para este evento." },
      { status: 403 },
    );
  }
  return { supabase, event };
}

export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | NextResponse> {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }
  return { data: parsed.data };
}

/** Códigos de domínio que significam "o estado atual não permite" → 409. */
const CONFLICT_CODES = new Set([
  "sorteio_bloqueado",
  "sorteio_com_resultados",
  "sorteio_concluido",
  "sorteio_nao_iniciado",
  "participantes_esgotados",
]);

/** Traduz erro da camada de dados em resposta; relança o que não conhece. */
export function raffleErrorResponse(error: unknown): NextResponse {
  if (error instanceof RaffleError) {
    const status =
      error.code === "sorteio_nao_encontrado" || error.code === "resultado_nao_encontrado"
        ? 404
        : CONFLICT_CODES.has(error.code)
          ? 409
          : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  if (error instanceof DbError) {
    const status =
      error.kind === "nao-encontrado" ? 404 : error.kind === "invalido" ? 400 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
  throw error;
}
