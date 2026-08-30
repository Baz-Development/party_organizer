import Link from "next/link";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/redirect";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { themeVars } from "@/lib/themes";
import { EntrarForm } from "./EntrarForm";

export const metadata = {
  title: "Entrar — Convite",
  description: "Acesse seu painel com um link enviado por e-mail.",
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next: rawNext, erro } = await searchParams;
  const next = safeNextPath(rawNext);

  // Quem já tem sessão não precisa passar por aqui.
  const user = await getAuthenticatedUser();
  if (user) redirect(next);

  return (
    <div
      style={themeVars("terracota")}
      className="flex min-h-screen items-center justify-center bg-paper-3 px-6 py-14"
    >
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-display text-[22px] font-semibold text-ink no-underline"
          >
            Convite
          </Link>
        </div>

        <div className="rounded-[24px] bg-paper p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:p-10">
          {erro === "link-invalido" && (
            <div
              role="alert"
              className="mb-6 rounded-xl bg-[rgba(168,68,58,0.09)] px-4 py-3.5 text-[14px] leading-relaxed text-danger"
            >
              Esse link de acesso não vale mais — ele expirou ou já foi usado.
              Peça um novo abaixo.
            </div>
          )}

          <h1 className="mb-2 font-display text-[26px] font-semibold">
            Entrar
          </h1>
          <p className="mb-7 text-[15px] leading-relaxed text-ink-soft">
            Para clientes e para a Equipe Villa Glam.
          </p>

          <EntrarForm next={next} />
        </div>

        <p className="mt-7 text-center text-[13.5px] leading-relaxed text-ink-faint">
          É convidado de um evento? Você não precisa de conta — basta abrir o
          link do convite que recebeu.
        </p>
      </div>
    </div>
  );
}
