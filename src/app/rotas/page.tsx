import Link from "next/link";
import { getShowcaseEvent, type ShowcaseEvent } from "@/lib/db/featured";
import { eventUrl } from "@/lib/event-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { themeVars } from "@/lib/themes";

export const metadata = {
  title: "Todas as telas — Convite",
  description: "Índice navegável de todas as telas.",
};

/** Usado quando o banco ainda não tem nenhum evento publicado. */
const EVENTO_EXEMPLO: ShowcaseEvent = {
  id: "00000000-0000-0000-0000-000000000000",
  slug: "marina-e-thiago",
};

const buildGroups = (
  event: ShowcaseEvent,
): { title: string; desc: string; items: { href: string; label: string; note: string }[] }[] =>
  [
    {
      title: "Público",
      desc: "O que o convidado vê pelo link do evento.",
      items: [
        { href: "/", label: "Landing Page", note: "Vitrine do produto, planos e FAQ" },
        { href: eventUrl(event), label: "Página do Evento", note: "Capa, contagem regressiva e módulos" },
        { href: eventUrl(event, "/rsvp"), label: "Fluxo RSVP", note: "3 passos: identificar, responder, agradecer" },
        { href: eventUrl(event, "/presentes"), label: "Lista de Presentes", note: "Lista → checkout (Pix/cartão) → sucesso" },
        { href: eventUrl(event, "/galeria"), label: "Galeria e Mural", note: "Mosaico de fotos + recados (tem estado vazio)" },
        { href: eventUrl(event, "/amigo-secreto"), label: "Amigo Secreto — Cadastro", note: "Lista de desejos do participante" },
        { href: eventUrl(event, "/amigo-secreto/revelacao"), label: "Amigo Secreto — Revelação", note: "Envelope animado com o sorteado" },
      ],
    },
    {
      title: "Cliente (quem organiza a festa)",
      desc: "Gestão do próprio evento, criado pela Equipe Villa Glam.",
      items: [
        { href: "/onboarding", label: "Página em preparação", note: "Informativa — o admin monta a página" },
        { href: "/sem-acesso", label: "Conta sem acesso", note: "Autenticou mas não foi provisionado" },
        { href: "/painel", label: "Painel do Cliente", note: "Contagem, confirmações, link e atividade" },
        { href: "/painel/convidados", label: "Gestão de Convidados", note: "Busca, filtros, tabela e detalhe" },
        { href: "/painel/editor", label: "Editor da Página", note: "Cor, textos, cronograma, cardápio e bar com preview ao vivo" },
      ],
    },
    {
      title: "Plataforma",
      desc: "Administração do produto pela Equipe Villa Glam.",
      items: [
        { href: "/admin", label: "Painel Admin", note: "Métricas, eventos e clientes recentes" },
        { href: "/admin/clientes", label: "Contas de cliente", note: "Cadastrar (convite) e listar" },
        { href: "/admin/paginas", label: "Nova página de evento", note: "Criar e atribuir o anfitrião" },
      ],
    },
  ];

const buildApiRoutes = (slug: string) => [
  { method: "GET", path: "/api/eventos" },
  { method: "GET", path: `/api/eventos/${slug}` },
  { method: "GET", path: `/api/eventos/${slug}/convidados` },
  { method: "POST", path: `/api/eventos/${slug}/convidados` },
  { method: "GET", path: `/api/eventos/${slug}/presentes` },
  { method: "GET", path: "/api/auth/callback" },
  { method: "POST", path: "/api/auth/sair" },
];

export default async function RotasPage() {
  const supabase = await createSupabaseServerClient();
  const event = (await getShowcaseEvent(supabase)) ?? EVENTO_EXEMPLO;

  const GROUPS = buildGroups(event);
  const API_ROUTES = buildApiRoutes(event.slug);

  return (
    <div style={themeVars("dourado")} className="min-h-screen bg-paper-3">
      <div className="mx-auto max-w-[1000px] px-6 py-14 pb-20">
        <div className="mb-10">
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">Protótipo</div>
          <h1 className="mb-3 font-display text-[clamp(28px,5vw,38px)] font-semibold">
            Todas as telas
          </h1>
          <p className="max-w-[640px] text-[16px] leading-relaxed text-ink-soft">
            Eventos, cronograma, cardápio e bar vêm do banco. Os módulos que
            ainda não migraram (presentes, galeria, mural e amigo secreto) leem
            de{" "}
            <code className="rounded bg-paper-2 px-1.5 py-0.5 text-[14px]">src/lib/fixtures/</code>.
          </p>
        </div>

        {GROUPS.map((g) => (
          <section key={g.title} className="mb-11">
            <h2 className="mb-1 font-display text-[22px] font-semibold">{g.title}</h2>
            <p className="mb-5 text-[14.5px] text-ink-soft">{g.desc}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="group block rounded-2xl border border-line bg-paper px-5 py-4.5 text-ink no-underline transition hover:border-accent hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-[15.5px] font-semibold">{it.label}</span>
                    <span className="text-accent opacity-0 transition group-hover:opacity-100">
                      →
                    </span>
                  </div>
                  <div className="mb-2 text-[13.5px] leading-relaxed text-ink-soft">{it.note}</div>
                  <code className="text-[12.5px] text-ink-faint">{it.href}</code>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="mb-1 font-display text-[22px] font-semibold">Rotas de API</h2>
          <p className="mb-5 text-[14.5px] text-ink-soft">
            Route handlers para consumo externo e para Client Components. As
            páginas de servidor chamam <code className="text-[13px]">src/lib/db/</code>{" "}
            direto, sem passar por aqui.
          </p>
          <div className="overflow-hidden rounded-2xl border border-line bg-paper">
            {API_ROUTES.map((r, i) => (
              <div
                key={`${r.method}-${r.path}`}
                className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <span
                  className={`w-12 shrink-0 text-[12px] font-bold ${
                    r.method === "GET" ? "text-ok" : "text-accent"
                  }`}
                >
                  {r.method}
                </span>
                <code className="text-[13.5px] text-ink-2">{r.path}</code>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12">
          <Link href="/" className="text-[15px] font-semibold text-accent no-underline">
            ← Voltar para a landing
          </Link>
        </div>
      </div>
    </div>
  );
}
