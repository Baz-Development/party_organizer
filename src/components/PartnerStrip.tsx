import Image from "next/image";
import type { Partner } from "@/lib/partners";

/**
 * Faixa de logos de parceiros (casas de eventos / buffets). Renderiza `null`
 * quando não há parceiro — quem chama também esconde a frase de parceria.
 */
export function PartnerStrip({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  return (
    <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-center gap-x-10 gap-y-6 px-8">
      {partners.map((p) => (
        <Image
          key={p.name}
          src={p.logo}
          alt={p.name}
          height={34}
          width={120}
          className="h-[34px] w-auto opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
        />
      ))}
    </div>
  );
}
