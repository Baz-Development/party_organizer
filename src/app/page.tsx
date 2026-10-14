import { getShowcaseEvent } from "@/lib/db/featured";
import { PARTNERS } from "@/lib/partners";
import { proofCount } from "@/lib/proof-count";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Landing } from "./Landing";

/**
 * A landing é um Client Component (tem abas e FAQ interativos), então o
 * servidor busca o evento de exemplo aqui e passa adiante como prop.
 */
export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const demoEvent = await getShowcaseEvent(supabase);

  // Filtro explícito: logado, a RLS também devolve os rascunhos do anfitrião.
  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "publicado");

  return (
    <Landing
      demoEvent={demoEvent}
      partners={PARTNERS}
      partyCount={proofCount(count ?? 0)}
    />
  );
}
