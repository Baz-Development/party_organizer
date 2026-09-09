"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ImageSlot } from "@/components/ImageSlot";
import { Button, Input, LinkButton, Stepper } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import { themeVars } from "@/lib/themes";
import type { EventSummary } from "@/lib/types";

type Attending = "sim" | "nao" | null;

interface DietPerson {
  id: string;
  label: string;
}

interface InvitedGuest {
  guestId: string;
  eventId: string;
  name: string;
  status: "pendente" | "confirmado" | "recusado";
  companions: number;
  kids: number;
  dietary: string | null;
}

export function RsvpFlow({
  event,
  token,
  signupToken,
}: {
  event: EventSummary;
  token: string | null;
  signupToken: string | null;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [invited, setInvited] = useState<InvitedGuest | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(!!token);
  const [attending, setAttending] = useState<Attending>(null);
  const [companions, setCompanions] = useState(0);
  const [kids, setKids] = useState(false);
  const [kidsCount, setKidsCount] = useState(0);
  const [dietary, setDietary] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetch(`/api/rsvp/${token}`)
      .then((res) => res.json())
      .then((body: { data: InvitedGuest | null }) => {
        if (cancelled) return;
        if (body.data) {
          setInvited(body.data);
          setName(body.data.name);
          setStep(2);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingInvite(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const identified = !!invited;
  const step1Disabled = name.trim().length === 0;
  const firstName = (name || "amigo").split(" ")[0];
  // Sem token de convidado e sem link de auto-cadastro: não há como responder.
  const needsInvite = !token && !signupToken;

  const dietPeople: DietPerson[] = useMemo(() => {
    const list: DietPerson[] = [{ id: "me", label: "Você" }];
    for (let i = 1; i <= companions; i++) list.push({ id: `comp-${i}`, label: `Acompanhante ${i}` });
    if (kids) for (let i = 1; i <= kidsCount; i++) list.push({ id: `kid-${i}`, label: `Criança ${i}` });
    return list;
  }, [companions, kids, kidsCount]);

  async function handleSubmit() {
    if (!attending) return;

    setSubmitting(true);
    setError(null);

    const payload = {
      status: attending === "sim" ? ("confirmado" as const) : ("recusado" as const),
      companions: attending === "sim" ? companions : 0,
      kids: attending === "sim" && kids ? kidsCount : 0,
      dietary: dietary.me || undefined,
    };

    try {
      const res = await fetch(
        token ? `/api/rsvp/${token}` : `/api/eventos/${event.slug}/rsvp-aberto`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            token ? payload : { ...payload, name, signupToken },
          ),
        },
      );

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Não foi possível registrar sua resposta.");
        return;
      }

      setStep(3);
    } catch {
      setError("Não foi possível registrar sua resposta. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInvite) {
    return (
      <div
        style={themeVars(event)}
        className="flex min-h-screen items-center justify-center bg-paper-3"
      >
        <p className="text-ink-soft">Carregando...</p>
      </div>
    );
  }

  return (
    <div
      style={themeVars(event)}
      className="flex min-h-screen justify-center bg-paper-3"
    >
      <div className="flex min-h-screen w-full max-w-[430px] flex-col bg-paper shadow-[0_0_60px_rgba(0,0,0,0.08)]">
        {/* Progresso ------------------------------------------------- */}
        <div className="px-6 pt-5">
          <div className="mb-6 flex min-h-6 items-center gap-3.5">
            {step > 1 && !identified ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                aria-label="Voltar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xl"
              >
                ←
              </button>
            ) : (
              <Link
                href={eventUrl(event)}
                aria-label="Voltar ao convite"
                className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-ink no-underline"
              >
                ←
              </Link>
            )}
            <div className="flex flex-1 gap-1.5">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-sm ${
                    step >= i ? "bg-accent" : "bg-[rgba(42,39,36,0.12)]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sem convite e sem link de auto-cadastro ------------------ */}
        {needsInvite && step === 1 && (
          <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
            <h1 className="mb-2.5 font-display text-[26px] font-semibold leading-[1.25]">
              Convite necessário
            </h1>
            <p className="text-[15px] leading-relaxed text-ink-soft">
              Este evento confirma presença pelo link de convite. Peça o seu a quem
              está organizando.
            </p>
          </div>
        )}

        {/* Passo 1 — identificação (só quando não veio por token) ---- */}
        {!needsInvite && step === 1 && (
          <div className="flex flex-1 animate-[fade-up_0.4s_ease_both] flex-col px-7">
            <div className="mb-5 h-24 w-24 overflow-hidden rounded-full">
              <ImageSlot shape="circle" placeholder="Foto" />
            </div>
            <h1 className="mb-2.5 font-display text-[28px] font-semibold leading-[1.25]">
              Oi! Que bom te ver por aqui.
            </h1>
            <p className="mb-6 text-[16px] leading-relaxed text-ink-soft">
              Antes de tudo, como podemos te chamar?
            </p>

            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              className="mb-4"
            />

            <div className="flex-1" />
            <div className="py-6">
              <Button full size="lg" disabled={step1Disabled} onClick={() => setStep(2)}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Passo 2 — resposta ---------------------------------------- */}
        {step === 2 && (
          <div className="flex flex-1 animate-[fade-up_0.4s_ease_both] flex-col px-7">
            <h1 className="mb-2.5 font-display text-[26px] font-semibold leading-[1.25]">
              Que bom, {firstName}!
            </h1>
            <p className="mb-5 text-[16px] leading-relaxed text-ink-soft">
              Você vai poder celebrar com a gente?
            </p>

            <div className="mb-6 flex gap-2.5">
              {(["sim", "nao"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setAttending(v)}
                  className={`flex-1 cursor-pointer rounded-xl border px-3 py-4 text-sm font-semibold ${
                    attending === v
                      ? "border-accent bg-accent text-on-accent"
                      : "border-[rgba(42,39,36,0.2)] bg-white text-ink"
                  }`}
                >
                  {v === "sim" ? "Sim, estarei lá" : "Não vou conseguir"}
                </button>
              ))}
            </div>

            {attending === "sim" && (
              <div>
                <span className="mb-2.5 block text-[13px] tracking-wide text-ink-soft">
                  Quantos acompanhantes vêm com você?
                </span>
                <div className="mb-6">
                  <Stepper value={companions} onChange={setCompanions} />
                </div>

                <label className="mb-4 flex cursor-pointer items-center gap-2.5 text-[15px]">
                  <input
                    type="checkbox"
                    checked={kids}
                    onChange={(e) => setKids(e.target.checked)}
                    className="h-5 w-5"
                  />
                  Vou levar crianças
                </label>

                {kids && (
                  <div className="mb-6">
                    <Stepper value={kidsCount} onChange={setKidsCount} />
                  </div>
                )}

                <span className="mb-1 block text-[13px] tracking-wide text-ink-soft">
                  Alguma restrição alimentar? (opcional)
                </span>
                <p className="mb-3 text-[13px] text-ink-faint">
                  Se preferir, conte pra gente pessoa por pessoa.
                </p>
                <div className="flex flex-col gap-2.5">
                  {dietPeople.map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <div className="w-25 shrink-0 text-sm text-ink-soft">{p.label}</div>
                      <Input
                        value={dietary[p.id] ?? ""}
                        onChange={(e) =>
                          setDietary((d) => ({ ...d, [p.id]: e.target.value }))
                        }
                        placeholder="Sem restrição"
                        className="min-w-0 flex-1 px-3.5 py-3 text-[15px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attending === "nao" && (
              <p className="rounded-xl bg-paper-2 px-4.5 py-4 text-[15px] leading-[1.7] text-ink-soft">
                Vamos sentir sua falta! Obrigado por nos avisar — significa muito.
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-xl bg-[rgba(200,60,60,0.08)] px-4 py-3 text-[14px] text-[#a63c3c]">
                {error}
              </p>
            )}

            <div className="flex-1" />
            <div className="py-6">
              <Button full size="lg" disabled={!attending || submitting} onClick={handleSubmit}>
                {submitting
                  ? "Enviando..."
                  : attending === "nao"
                    ? "Enviar resposta"
                    : "Confirmar presença"}
              </Button>
            </div>
          </div>
        )}

        {/* Passo 3 — agradecimento ----------------------------------- */}
        {step === 3 && (
          <div className="flex flex-1 animate-[fade-up_0.4s_ease_both] flex-col items-center justify-center px-7 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-[28px] text-on-accent">
              ✓
            </div>
            <h1 className="mb-3 font-display text-[28px] font-semibold leading-[1.25]">
              {attending === "nao" ? "Obrigado por avisar!" : "Presença confirmada!"}
            </h1>
            <p className="mb-8 max-w-[300px] text-[16px] leading-[1.7] text-ink-soft">
              {attending === "nao"
                ? `Sentiremos sua falta, ${firstName}. Muito obrigado por nos responder.`
                : `Obrigado, ${firstName}! Já anotamos tudo por aqui. Mal podemos esperar para celebrar com você.`}
            </p>

            {attending === "sim" && (
              <LinkButton href={eventUrl(event, "/presentes")} size="lg">
                Ver lista de presentes
              </LinkButton>
            )}
            <Link
              href={eventUrl(event)}
              className="mt-4 text-[15px] text-ink-soft underline"
            >
              Voltar ao convite
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
