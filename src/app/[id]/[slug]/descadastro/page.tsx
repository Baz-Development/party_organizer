import { loadPublicEvent } from "../load-event";
import { DescadastroConfirm } from "./DescadastroConfirm";

export const metadata = { title: "Descadastro — Convite" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { id } = await params;
  const { email } = await searchParams;
  const event = await loadPublicEvent(id);

  return <DescadastroConfirm event={event} email={email ?? ""} />;
}
