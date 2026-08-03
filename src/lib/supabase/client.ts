"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env.public";

/**
 * Cliente do Supabase para Client Components.
 *
 * Só a chave anônima chega aqui — tudo que este cliente enxerga é o que a RLS
 * permite ao usuário da sessão.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
