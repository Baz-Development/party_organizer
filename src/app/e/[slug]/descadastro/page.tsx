import { loadPublicEvent } from "../load-event";
import { DescadastroConfirm } from "./DescadastroConfirm";

export const metadata = { title: "Descadastro — Convite" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { slug } = await params;
  const { email } = await searchParams;
  const event = await loadPublicEvent(slug);

  return <DescadastroConfirm event={event} email={email ?? ""} />;
}
