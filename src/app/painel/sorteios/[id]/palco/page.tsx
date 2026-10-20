import { loadRaffleHostEvent } from "../../load";
import { RaffleStage } from "./RaffleStage";

export const metadata = { title: "Sorteio ao vivo — Convite" };

/**
 * Tela de apresentação do sorteio — feita para ser projetada ou transmitida.
 * Cobre o painel inteiro (inclusive o menu) com uma camada fixa.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await loadRaffleHostEvent(`/painel/sorteios/${id}/palco`);

  return (
    <RaffleStage
      event={{
        slug: event.slug,
        title: event.title,
        hosts: event.hosts,
        themeKey: event.themeKey,
        accentColor: event.accentColor,
        accentTextColor: event.accentTextColor,
      }}
      raffleId={id}
    />
  );
}
