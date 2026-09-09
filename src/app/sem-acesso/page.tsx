import { SairButton } from "@/components/SairButton";
import { themeVars } from "@/lib/themes";

export const metadata = { title: "Conta sem acesso — Convite" };

/**
 * Destino de quem autenticou mas não tem para onde ir: um e-mail que pediu
 * link mágico sem ter sido provisionado pela Equipe Villa Glam e sem ser
 * anfitrião de nenhum evento. A sessão existe, mas nenhum painel se abre.
 */
export default function SemAcessoPage() {
  return (
    <div style={themeVars({ themeKey: "dourado" })} className="min-h-screen bg-paper-3">
      <div className="mx-auto max-w-[560px] px-6 py-24 text-center">
        <div className="mb-6 text-[13px] uppercase tracking-[2px] text-accent">Villa Glam</div>
        <h1 className="mb-4 font-display text-[clamp(24px,4vw,32px)] font-semibold">
          Esta conta ainda não tem acesso
        </h1>
        <p className="mb-8 text-[16px] leading-relaxed text-ink-soft">
          O acesso ao painel é liberado pela Equipe Villa Glam quando o contrato
          é fechado e a página do evento é criada. Se você esperava ter acesso,
          fale com a equipe usando o e-mail deste login.
        </p>
        <div className="flex justify-center">
          <SairButton />
        </div>
      </div>
    </div>
  );
}
