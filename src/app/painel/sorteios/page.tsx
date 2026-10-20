import { loadRaffleHostEvent } from "./load";
import { RaffleList } from "./RaffleList";

export const metadata = { title: "Sorteios — Convite" };

export default async function Page() {
  const event = await loadRaffleHostEvent("/painel/sorteios");

  return <RaffleList event={{ slug: event.slug, title: event.title }} />;
}
