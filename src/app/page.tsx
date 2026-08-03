import { getShowcaseSlug } from "@/lib/db/featured";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Landing } from "./Landing";

/**
 * A landing é um Client Component (tem abas e FAQ interativos), então o
 * servidor busca o evento de exemplo aqui e passa adiante como prop.
 */
export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const demoSlug = await getShowcaseSlug(supabase);

  return <Landing demoSlug={demoSlug} />;
}
