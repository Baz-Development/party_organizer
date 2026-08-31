"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import type { EventSummary, MuralMessage, Photo } from "@/lib/types";

type Tab = "galeria" | "mural";

async function patchJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

/**
 * Fila de moderação. A galeria tem aprovação prévia — fotos podem estar
 * pendentes. O mural não: todo recado nasce visível, e a moderação é só
 * reativa (ocultar/remover). A RLS já garante que só quem administra o evento
 * enxerga o conteúdo de outros eventos — esta tela só lista o que a API
 * devolveu.
 */
export function ModerationQueue({ event }: { event: EventSummary }) {
  const [tab, setTab] = useState<Tab>("galeria");
  const [status, setStatus] = useState<"pendente" | "aprovada" | "oculta">("pendente");

  // O mural não tem estado "pendente" — só "aprovada"/"oculta".
  const statusOptions =
    tab === "galeria"
      ? (["pendente", "aprovada", "oculta"] as const)
      : (["aprovada", "oculta"] as const);
  const effectiveStatus: "pendente" | "aprovada" | "oculta" =
    tab === "mural" && status === "pendente" ? "aprovada" : status;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState<MuralMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const base = tab === "galeria" ? "galeria" : "mural";

    fetch(`/api/eventos/${event.slug}/${base}?status=${effectiveStatus}&limit=50`)
      .then((res) => res.json())
      .then((body: { data: (Photo | MuralMessage)[] }) => {
        if (cancelled) return;
        if (tab === "galeria") setPhotos((body.data as Photo[]) ?? []);
        else setNotes((body.data as MuralMessage[]) ?? []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [event.slug, tab, effectiveStatus]);

  async function moderatePhoto(id: string, next: "aprovada" | "oculta") {
    const ok = await patchJson(`/api/eventos/${event.slug}/galeria/${id}`, { status: next });
    if (ok) setPhotos((ps) => ps.filter((p) => p.id !== id));
  }

  async function removePhoto(id: string) {
    const res = await fetch(`/api/eventos/${event.slug}/galeria/${id}`, { method: "DELETE" });
    if (res.ok) setPhotos((ps) => ps.filter((p) => p.id !== id));
  }

  async function moderateNote(id: string, next: "aprovada" | "oculta") {
    const ok = await patchJson(`/api/eventos/${event.slug}/mural/${id}`, { status: next });
    if (ok) setNotes((ns) => ns.filter((n) => n.id !== id));
  }

  async function removeNote(id: string) {
    const res = await fetch(`/api/eventos/${event.slug}/mural/${id}`, { method: "DELETE" });
    if (res.ok) setNotes((ns) => ns.filter((n) => n.id !== id));
  }

  return (
    <main className="mx-auto max-w-[900px] px-6 py-10">
      <h1 className="mb-1 font-display text-[26px] font-semibold">Moderação</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Galeria: {event.moderationPolicy === "previa" ? "aprovação prévia" : "publicação imediata"}.
        {" "}Mural: publicação imediata, sem fila — só ocultar ou remover.
      </p>

      <div className="mb-5 flex gap-2 rounded-full bg-paper-2 p-1 w-fit">
        {(["galeria", "mural"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
              tab === t ? "bg-ink text-paper" : "text-ink-soft"
            }`}
          >
            {t === "galeria" ? "Galeria" : "Mural"}
          </button>
        ))}
      </div>

      <div className="mb-6 flex gap-2">
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${
              effectiveStatus === s ? "border-accent bg-paper-2" : "border-line-strong text-ink-soft"
            }`}
          >
            {s === "pendente" ? "Pendentes" : s === "aprovada" ? "Aprovados" : "Ocultos"}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-ink-soft">Carregando…</p>}

      {!loading && tab === "galeria" && photos.length === 0 && (
        <p className="text-sm text-ink-soft">Nada por aqui.</p>
      )}

      {!loading && tab === "galeria" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-line bg-paper">
              <div className="aspect-square bg-paper-2">
                {p.url && (
                  // eslint-disable-next-line @next/next/no-img-element -- URL assinada.
                  <img src={p.url} alt={p.caption ?? p.author} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <div className="mb-2 text-[12.5px] font-semibold">{p.author}</div>
                <div className="flex flex-wrap gap-1.5">
                  {effectiveStatus !== "aprovada" && (
                    <Button size="sm" onClick={() => moderatePhoto(p.id, "aprovada")}>
                      Aprovar
                    </Button>
                  )}
                  {effectiveStatus !== "oculta" && (
                    <Button size="sm" variant="outline" onClick={() => moderatePhoto(p.id, "oculta")}>
                      Ocultar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => removePhoto(p.id)}>
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "mural" && notes.length === 0 && (
        <p className="text-sm text-ink-soft">Nada por aqui.</p>
      )}

      {!loading && tab === "mural" && (
        <div className="flex flex-col gap-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-line bg-paper p-4">
              <div className="mb-1 text-[12.5px] font-semibold">{n.author}</div>
              {n.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- URL assinada.
                <img
                  src={n.photoUrl}
                  alt={`Foto de ${n.author}`}
                  className="mb-3 max-h-40 rounded-lg object-cover"
                />
              )}
              <p className="mb-3 text-sm text-ink-2">{n.message}</p>
              <div className="flex flex-wrap gap-1.5">
                {effectiveStatus !== "aprovada" && (
                  <Button size="sm" onClick={() => moderateNote(n.id, "aprovada")}>
                    Aprovar
                  </Button>
                )}
                {effectiveStatus !== "oculta" && (
                  <Button size="sm" variant="outline" onClick={() => moderateNote(n.id, "oculta")}>
                    Ocultar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => removeNote(n.id)}>
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
