"use client";

import { useState } from "react";
import { GuestShell } from "@/components/GuestShell";
import { ImageSlot } from "@/components/ImageSlot";
import { Button, Sheet, Textarea } from "@/components/ui";
import { MURAL, PHOTOS } from "@/lib/fixtures/media";
import type { EventSummary } from "@/lib/types";

const HEIGHTS = [160, 220, 190, 150, 210, 170, 200, 165, 185];
const ROTATIONS = [-2, 1.5, -1, 2, -1.5, 1];
const MAX_CHARS = 180;

interface Note {
  id: string;
  author: string;
  message: string;
}

export function GalleryAndMural({ event }: { event: EventSummary }) {
  const [tab, setTab] = useState<"galeria" | "mural">("galeria");
  const [empty, setEmpty] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<Note[]>(
    MURAL.filter((m) => m.approved).map((m) => ({
      id: m.id,
      author: m.author,
      message: m.message,
    })),
  );

  const photos = PHOTOS.filter((p) => p.approved);
  const submitDisabled = draft.trim().length === 0;

  const submit = () => {
    if (submitDisabled) return;
    setNotes((n) => [
      { id: `local-${Date.now()}`, author: "Você", message: draft.trim() },
      ...n,
    ]);
    setDraft("");
    setComposeOpen(false);
  };

  return (
    <GuestShell event={event}>
      {/* Alternador de estado da demo (com conteúdo / vazio) */}
      <div className="flex justify-end px-6">
        <div className="flex gap-1 rounded-full bg-paper-2 p-1">
          {[
            { v: false, l: "Com conteúdo" },
            { v: true, l: "Vazio" },
          ].map((o) => (
            <button
              key={o.l}
              onClick={() => setEmpty(o.v)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${
                empty === o.v ? "bg-accent text-on-accent" : "text-ink-faint"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

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
            <Button size="sm" variant="outline" className="rounded-full">
              Adicionar foto
            </Button>
          </div>

          {empty ? (
            <EmptyGallery />
          ) : (
            <div className="columns-2 gap-2.5 [column-fill:balance]">
              {photos.map((p, i) => (
                <figure
                  key={p.id}
                  style={{ height: HEIGHTS[i % HEIGHTS.length] }}
                  className="mb-2.5 break-inside-avoid overflow-hidden rounded-xl"
                >
                  <ImageSlot placeholder={p.caption ?? `Foto de ${p.author}`} compact />
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

          {empty ? (
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
                  <div className="mb-3 text-[14.5px] leading-[1.55] text-[#3a3630]">{m.message}</div>
                  <div className="text-[12.5px] font-semibold text-ink-faint">{m.author}</div>
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
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Escreva algo especial..."
          className="min-h-28"
        />
        <div className="my-1.5 mb-5 text-right text-xs text-ink-faint">
          {draft.length}/{MAX_CHARS}
        </div>
        <Button full size="lg" disabled={submitDisabled} onClick={submit}>
          Enviar recado
        </Button>
      </Sheet>
    </GuestShell>
  );
}

function EmptyGallery() {
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
      <Button>Adicionar foto</Button>
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
