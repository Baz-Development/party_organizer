"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GuestShell } from "@/components/GuestShell";
import { Button, Field, Input, Sheet, Textarea } from "@/components/ui";
import type { EventSummary, MuralMessage, Photo } from "@/lib/types";
import { getVisitorId } from "@/lib/visitor";

const MAX_CHARS = 180;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data?: T; error?: string }> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: body?.error ?? "Algo deu errado. Tente novamente." };
  return { ok: true, data: body?.data as T };
}

export function GalleryAndMural({ event }: { event: EventSummary }) {
  const [tab, setTab] = useState<"galeria" | "mural">("galeria");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState<MuralMessage[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [author, setAuthor] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const noteFileInput = useRef<HTMLInputElement>(null);
  const [notePhoto, setNotePhoto] = useState<{ path: string; previewUrl: string } | null>(null);
  const [notePhotoUploading, setNotePhotoUploading] = useState(false);

  const visitorId = getVisitorId();

  const loadPhotos = useCallback(async () => {
    const res = await fetch(`/api/eventos/${event.slug}/galeria`);
    const body = (await res.json()) as { data: Photo[] };
    setPhotos(body.data ?? []);
    setLoadingPhotos(false);
  }, [event.slug]);

  // A carga inicial fica inline (não chama `loadPhotos`): a função também é
  // usada para recarregar a galeria depois de um envio confirmado, e o lint
  // de hooks recusa `setState` alcançável a partir do corpo de um efeito —
  // mesmo padrão de `GuestManager.tsx`.
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/eventos/${event.slug}/galeria`).then((res) => res.json()),
      fetch(`/api/eventos/${event.slug}/mural`).then((res) => res.json()),
    ]).then(([photoBody, noteBody]: [{ data: Photo[] }, { data: MuralMessage[] }]) => {
      if (cancelled) return;
      setPhotos(photoBody.data ?? []);
      setNotes(noteBody.data ?? []);
      setLoadingPhotos(false);
      setLoadingNotes(false);
    });

    return () => {
      cancelled = true;
    };
  }, [event.slug]);

  const submitDisabled = draft.trim().length === 0 || author.trim().length === 0;

  async function submitNote() {
    if (submitDisabled) return;
    setSending(true);
    setFormError(null);

    const result = await fetchJson<MuralMessage>(`/api/eventos/${event.slug}/mural`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        author: author.trim(),
        message: draft.trim(),
        photoPath: notePhoto?.path,
      }),
    });

    setSending(false);
    if (!result.ok) {
      setFormError(result.error ?? "Não foi possível enviar seu recado.");
      return;
    }

    // O mural publica sempre na hora — sem aprovação prévia.
    if (result.data) {
      setNotes((n) => [result.data as MuralMessage, ...n]);
    }
    setDraft("");
    setNotePhoto(null);
    setComposeOpen(false);
  }

  async function handleNotePhotoSelected(file: File) {
    setNotePhotoUploading(true);
    setFormError(null);

    const uploadReq = await fetchJson<{ path: string; signedUrl: string; token: string }>(
      `/api/eventos/${event.slug}/mural/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, contentType: file.type }),
      },
    );

    if (!uploadReq.ok || !uploadReq.data) {
      setNotePhotoUploading(false);
      setFormError(uploadReq.error ?? "Não foi possível preparar o envio da foto.");
      return;
    }

    const putRes = await fetch(uploadReq.data.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    setNotePhotoUploading(false);
    if (!putRes.ok) {
      setFormError("Não foi possível enviar a foto.");
      return;
    }

    setNotePhoto({ path: uploadReq.data.path, previewUrl: URL.createObjectURL(file) });
  }

  async function handleFileSelected(file: File) {
    setUploading(true);
    setFormError(null);

    const uploadReq = await fetchJson<{ path: string; signedUrl: string; token: string }>(
      `/api/eventos/${event.slug}/galeria/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, contentType: file.type }),
      },
    );

    if (!uploadReq.ok || !uploadReq.data) {
      setUploading(false);
      setFormError(uploadReq.error ?? "Não foi possível preparar o envio.");
      return;
    }

    const putRes = await fetch(uploadReq.data.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!putRes.ok) {
      setUploading(false);
      setFormError("Não foi possível enviar o arquivo.");
      return;
    }

    let authorName = window.localStorage.getItem("convite:autor")?.trim() || author.trim();
    if (!authorName) {
      authorName = window.prompt("Como devemos assinar sua foto?")?.trim() ?? "";
    }
    if (!authorName) {
      setUploading(false);
      setFormError("Informe seu nome antes de enviar a foto.");
      return;
    }

    const confirmRes = await fetchJson<Photo>(`/api/eventos/${event.slug}/galeria`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        storagePath: uploadReq.data.path,
        author: authorName,
      }),
    });

    setUploading(false);
    if (!confirmRes.ok) {
      setFormError(confirmRes.error ?? "Não foi possível concluir o envio.");
      return;
    }

    window.localStorage.setItem("convite:autor", authorName);
    loadPhotos();
  }

  async function like(kind: "galeria" | "mural", id: string) {
    const path = kind === "galeria" ? "galeria" : "mural";
    const result = await fetchJson<{ likes: number }>(
      `/api/eventos/${event.slug}/${path}/${id}/curtir`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      },
    );
    if (!result.ok || !result.data) return;

    if (kind === "galeria") {
      setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, likes: result.data!.likes } : p)));
    } else {
      setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, likes: result.data!.likes } : n)));
    }
  }

  const HEIGHTS = [160, 220, 190, 150, 210, 170, 200, 165, 185];
  const ROTATIONS = [-2, 1.5, -1, 2, -1.5, 1];

  return (
    <GuestShell event={event}>
      <div className="px-6 pt-4">
        <div className="mb-6 flex gap-2 rounded-full bg-paper-2 p-1">
          {(["galeria", "mural"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 cursor-pointer rounded-full px-3.5 py-2.5 text-sm font-semibold ${
                tab === t ? "bg-ink text-paper" : "text-ink-soft"
              }`}
            >
              {t === "galeria" ? "Galeria" : "Mural de recados"}
            </button>
          ))}
        </div>
      </div>

      {/* Galeria ----------------------------------------------------- */}
      {tab === "galeria" && (
        <div className="flex-1 animate-[fade-up_0.3s_ease_both] px-6 pb-10">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-display text-[22px] font-semibold">Momentos</h1>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {uploading ? "Enviando..." : "Adicionar foto"}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleFileSelected(file);
              }}
            />
          </div>

          {formError && <p className="mb-4 text-sm text-red-600">{formError}</p>}

          {!loadingPhotos && photos.length === 0 ? (
            <EmptyGallery onAdd={() => fileInput.current?.click()} />
          ) : (
            <div className="columns-2 gap-2.5 [column-fill:balance]">
              {photos.map((p, i) => (
                <figure
                  key={p.id}
                  style={{ height: HEIGHTS[i % HEIGHTS.length] }}
                  className="relative mb-2.5 break-inside-avoid overflow-hidden rounded-xl bg-paper-2"
                >
                  {p.url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL assinada, de curta duração.
                    <img
                      src={p.url}
                      alt={p.caption ?? `Foto de ${p.author}`}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <button
                    onClick={() => like("galeria", p.id)}
                    className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white"
                  >
                    ♥ {p.likes}
                  </button>
                </figure>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mural -------------------------------------------------------- */}
      {tab === "mural" && (
        <div className="flex-1 animate-[fade-up_0.3s_ease_both] px-6 pb-10">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-display text-[22px] font-semibold">Recados</h1>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setComposeOpen(true)}
            >
              Deixar um recado
            </Button>
          </div>

          {!loadingNotes && notes.length === 0 ? (
            <EmptyMural hosts={event.hosts} onCompose={() => setComposeOpen(true)} />
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {notes.map((m, i) => (
                <div
                  key={m.id}
                  style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)` }}
                  className="rounded-2xl border border-line bg-[#fffdf9] px-3.5 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]"
                >
                  <div className="mb-2.5 h-0.5 w-7 rounded-sm bg-accent" />
                  {m.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- URL assinada, de curta duração.
                    <img
                      src={m.photoUrl}
                      alt={`Foto de ${m.author}`}
                      className="mb-3 max-h-48 w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="mb-3 text-[14.5px] leading-[1.55] text-[#3a3630]">{m.message}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-[12.5px] font-semibold text-ink-faint">{m.author}</div>
                    <button
                      onClick={() => like("mural", m.id)}
                      className="cursor-pointer text-[12px] font-semibold text-ink-faint"
                    >
                      ♥ {m.likes}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Composer ----------------------------------------------------- */}
      <Sheet open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth={430}>
        <div className="mb-1.5 font-display text-[22px] font-semibold">Deixe um recado</div>
        <p className="mb-4.5 text-sm text-ink-soft">
          Uma mensagem carinhosa para {event.hosts} guardarem.
        </p>
        <div className="mb-3">
          <Field label="Seu nome">
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Como devemos te chamar?"
            />
          </Field>
        </div>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Escreva algo especial..."
          className="min-h-28"
        />
        <div className="my-1.5 text-right text-xs text-ink-faint">
          {draft.length}/{MAX_CHARS}
        </div>
        <div className="mb-5 mt-2">
          <input
            ref={noteFileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleNotePhotoSelected(file);
            }}
          />
          {notePhoto ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- prévia local. */}
              <img
                src={notePhoto.previewUrl}
                alt="Prévia da foto"
                className="h-16 w-16 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => setNotePhoto(null)}
                className="cursor-pointer text-[13px] font-semibold text-ink-soft underline"
              >
                Remover foto
              </button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={notePhotoUploading}
              onClick={() => noteFileInput.current?.click()}
            >
              {notePhotoUploading ? "Enviando..." : "Adicionar foto (opcional)"}
            </Button>
          )}
        </div>
        {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
        <Button
          full
          size="lg"
          disabled={submitDisabled || sending || notePhotoUploading}
          onClick={submitNote}
        >
          {sending ? "Enviando..." : "Enviar recado"}
        </Button>
      </Sheet>
    </GuestShell>
  );
}

function EmptyGallery({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-5 py-15 text-center">
      <div className="relative mb-6 h-16 w-16 rounded-2xl border-[1.5px] border-[rgba(42,39,36,0.25)]">
        <span className="absolute left-1/2 top-1/2 h-5 w-7 -translate-x-1/2 -translate-y-1/2 rounded border-[1.5px] border-[rgba(42,39,36,0.35)]" />
        <span className="absolute left-1/2 top-[41%] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[rgba(42,39,36,0.35)]" />
      </div>
      <div className="mb-2 font-display text-[20px] font-semibold">Nenhuma foto ainda</div>
      <p className="mb-6 max-w-[260px] text-[15px] leading-relaxed text-ink-soft">
        Seja o primeiro a compartilhar um momento desse dia especial.
      </p>
      <Button onClick={onAdd}>Adicionar foto</Button>
    </div>
  );
}

function EmptyMural({ hosts, onCompose }: { hosts: string; onCompose: () => void }) {
  return (
    <div className="flex flex-col items-center px-5 py-15 text-center">
      <div className="relative mb-6 h-13 w-16 rounded-lg border-[1.5px] border-[rgba(42,39,36,0.25)]">
        <span className="absolute left-2.5 right-2.5 top-3.5 h-px bg-[rgba(42,39,36,0.25)]" />
        <span className="absolute left-2.5 right-5.5 top-6 h-px bg-[rgba(42,39,36,0.25)]" />
        <span className="absolute left-2.5 right-7.5 top-8.5 h-px bg-[rgba(42,39,36,0.25)]" />
      </div>
      <div className="mb-2 font-display text-[20px] font-semibold">Nenhum recado ainda</div>
      <p className="mb-6 max-w-[260px] text-[15px] leading-relaxed text-ink-soft">
        Seja o primeiro a deixar um recado para {hosts}.
      </p>
      <Button onClick={onCompose}>Deixar um recado</Button>
    </div>
  );
}
