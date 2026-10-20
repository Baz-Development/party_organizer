import { loadRaffleHostEvent } from "../load";
import { RaffleEditor } from "./RaffleEditor";

export const metadata = { title: "Sorteio — Convite" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await loadRaffleHostEvent(`/painel/sorteios/${id}`);

  return <RaffleEditor event={{ slug: event.slug, title: event.title }} raffleId={id} />;
}
