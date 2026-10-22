import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { listEvents } from "@/lib/db/events";
import { resolveCoverUrl } from "@/lib/db/media";
import { EditorForm } from "./EditorForm";

export const metadata = { title: "Editor da página — Convite" };

export default async function Page() {
  const { supabase, user, profile } = await requireSession("/painel/editor");

  const events = await listEvents(supabase, { hostProfileId: user.id });
  const event = events[0];

  if (!event) redirect("/painel");

  const coverUrl = await resolveCoverUrl(supabase, event.coverPath);

  return <EditorForm event={{ ...event, coverUrl }} isAdmin={profile.role === "admin"} />;
}
