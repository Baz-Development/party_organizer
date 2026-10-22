"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Countdown } from "@/components/Countdown";
import { ImageSlot } from "@/components/ImageSlot";
import { Button, Field, Input, Sheet, Stepper } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import { brl, longDate } from "@/lib/format";
import { themeVars } from "@/lib/themes";
import type { EventSummary, Gift, MenuItem, ModuleId, ScheduleItem } from "@/lib/types";

const MODULE_LABELS: Partial<Record<ModuleId, string>> = {
  cronograma: "Cronograma",
  local: "Local",
  presentes: "Presentes",
  galeria: "Galeria",
  mural: "Mural",
  cardapio: "Cardápio",
  bar: "Bar",
  "amigo-secreto": "Amigo Secreto",
};

export function EventPage({ event }: { event: EventSummary }) {
  const has = (m: ModuleId) => event.modules.includes(m);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [secretJoined, setSecretJoined] = useState(false);

  const nav = event.sectionOrder
    .filter((m) => has(m) && MODULE_LABELS[m])
    .map((m) => ({ id: m, label: MODULE_LABELS[m]!, href: `#${m}` }));

  // Cardápio agrupado por etapa, preservando a ordem em que o anfitrião cadastrou.
  const menuCourses: { course: string; items: MenuItem[] }[] = [];
  for (const item of event.menu) {
    const bucket = menuCourses.find((c) => c.course === item.course);
    if (bucket) bucket.items.push(item);
    else menuCourses.push({ course: item.course, items: [item] });
  }

  // Cronograma agrupado por bloco (título), preservando a ordem cadastrada.
  const scheduleBlocks: { title: string; items: ScheduleItem[] }[] = [];
  for (const item of event.schedule) {
    const bucket = scheduleBlocks.find((b) => b.title === item.title);
    if (bucket) bucket.items.push(item);
    else scheduleBlocks.push({ title: item.title, items: [item] });
  }

  // Consulta do mapa: o endereço completo é o melhor alvo; sem ele, cai para
  // "local, cidade". Serve tanto o mapa embutido quanto o link "ver rota".
  const mapsQuery = [event.address, event.venue, event.city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  const mapsEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  const [featuredGifts, setFeaturedGifts] = useState<Gift[]>([]);

  useEffect(() => {
    if (!has("presentes")) return;
    fetch(`/api/eventos/${event.slug}/presentes`)
      .then((res) => res.json())
      .then((body) => {
        const gifts: Gift[] = body.data ?? [];
        setFeaturedGifts(gifts.filter((g) => g.status === "disponivel").slice(0, 3));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.slug]);

  // Seções da página, na ordem que o anfitrião definiu; só as ativas entram.
  const sectionOrder = event.sectionOrder.filter(has);
  const sections: Partial<Record<ModuleId, ReactNode>> = {
    // Cronograma
    cronograma: has("cronograma") && (
          <section id="cronograma" className="px-6 py-16 text-center sm:px-10 sm:py-18">
            <div className="eyebrow mb-2.5">Programação</div>
            <h2 className="mb-10 font-display text-[clamp(26px,4vw,38px)] font-semibold">
              Cronograma do dia
            </h2>
            <div className="mx-auto flex max-w-[960px] flex-col gap-10 text-left">
              {scheduleBlocks.map((block) => (
                <div key={block.title}>
                  <div className="mb-4 border-b border-line pb-2 text-center font-display text-[13px] uppercase tracking-[2.5px] text-accent">
                    {block.title}
                  </div>
                  <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
                    {block.items.map((ev, i) => (
                      <div key={`${ev.time}-${i}`}>
                        {ev.time && (
                          <div className="mb-1.5 text-sm font-semibold text-accent">{ev.time}</div>
                        )}
                        <div className="text-[15px] text-ink-soft">{ev.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
    ),

    // Local
    local: has("local") && (
          <section
            id="local"
            className="grid items-center gap-10 px-6 pb-16 sm:px-10 sm:pb-18 lg:grid-cols-2 lg:gap-14"
          >
            <div className="text-center lg:text-left">
              <div className="eyebrow mb-3">Local</div>
              <h2 className="mb-2.5 font-display text-[clamp(26px,4vw,38px)] font-semibold">
                {event.venue}
              </h2>
              <div className="mb-2 text-[17px] text-ink-soft">{event.city}</div>
              {event.address && (
                <div className="mb-1 text-[15px] text-ink-soft">{event.address}</div>
              )}
              {event.postalCode && (
                <div className="mb-6 text-[15px] text-ink-faint">CEP {event.postalCode}</div>
              )}
              {mapsQuery && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-full border border-[rgba(42,39,36,0.3)] px-6 py-3 text-[15px] text-ink no-underline hover:bg-paper-2"
                >
                  Ver rota no mapa
                </a>
              )}
            </div>
            <div className="h-[240px] overflow-hidden rounded-[20px] lg:h-[320px]">
              {mapsQuery ? (
                <iframe
                  title={`Mapa — ${event.venue || event.city}`}
                  src={mapsEmbedSrc}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <ImageSlot placeholder="Mapa de localização" />
              )}
            </div>
          </section>
    ),

    // Presentes
    presentes: has("presentes") && (
          <section id="presentes" className="bg-paper-2 px-6 py-16 text-center sm:px-10 sm:py-18">
            <div className="eyebrow mb-2.5">Lista de presentes</div>
            <h2 className="mb-10 font-display text-[clamp(26px,4vw,38px)] font-semibold">Presentes</h2>
            <div className="mx-auto grid max-w-[900px] gap-6 sm:grid-cols-3">
              {featuredGifts.map((g) => (
                <div key={g.id} className="rounded-[18px] bg-paper p-6 text-left">
                  <div className="mb-4 h-[140px] w-full overflow-hidden rounded-xl">
                    <ImageSlot placeholder={g.name} />
                  </div>
                  <div className="text-[17px] font-semibold">{g.name}</div>
                  <div className="mt-1 text-sm text-ink-soft">
                    {g.quota ? `Cotas a partir de ${brl(g.price)}` : brl(g.price)}
                  </div>
                </div>
              ))}
            </div>
            <Link
              href={eventUrl(event, "/presentes")}
              className="mt-8 inline-block rounded-full border border-[rgba(42,39,36,0.3)] px-6 py-3 text-[15px] text-ink no-underline hover:bg-paper"
            >
              Ver lista completa
            </Link>
          </section>
    ),

    // Galeria
    galeria: has("galeria") && (
          <section id="galeria" className="px-6 py-16 text-center sm:px-10 sm:py-18">
            <div className="eyebrow mb-2.5">Memórias</div>
            <h2 className="mb-8 font-display text-[clamp(26px,4vw,38px)] font-semibold">Galeria</h2>
            <div className="mx-auto grid max-w-[960px] grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5">
              {event.gallery.map((g) => (
                <div key={g.id} className="aspect-square overflow-hidden rounded-xl sm:aspect-[4/3]">
                  {g.url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL assinada, de curta duração.
                    <img src={g.url} alt={g.label} className="h-full w-full object-cover" />
                  ) : (
                    <ImageSlot placeholder={g.label} />
                  )}
                </div>
              ))}
            </div>
            <Link
              href={eventUrl(event, "/galeria")}
              className="mt-8 inline-block rounded-full border border-[rgba(42,39,36,0.3)] px-6 py-3 text-[15px] text-ink no-underline hover:bg-paper-2"
            >
              Enviar minhas fotos
            </Link>
          </section>
    ),

    // Cardápio
    cardapio: has("cardapio") && (
          <section id="cardapio" className="bg-paper-2 px-6 py-16 text-center sm:px-10 sm:py-18">
            <div className="eyebrow mb-2.5">À mesa</div>
            <h2 className="mb-10 font-display text-[clamp(26px,4vw,38px)] font-semibold">Cardápio</h2>
            {menuCourses.length === 0 ? (
              <p className="text-[16px] leading-relaxed text-ink-soft">
                O cardápio será divulgado em breve.
              </p>
            ) : (
              <div className="mx-auto flex max-w-[720px] flex-col gap-10 text-left">
                {menuCourses.map((group) => (
                  <div key={group.course}>
                    <div className="mb-4 border-b border-line pb-2 text-center font-display text-[13px] uppercase tracking-[2.5px] text-accent">
                      {group.course}
                    </div>
                    <div className="flex flex-col gap-5">
                      {group.items.map((item, i) => (
                        <div key={`${item.name}-${i}`}>
                          <div className="font-display text-[19px] font-semibold">{item.name}</div>
                          {item.desc && (
                            <div className="mt-1 text-[15px] leading-relaxed text-ink-soft">
                              {item.desc}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
    ),

    // Bar
    bar: has("bar") && (
          <section id="bar" className="px-6 py-16 text-center sm:px-10 sm:py-18">
            <div className="eyebrow mb-2.5">Para brindar</div>
            <h2 className="mb-4 font-display text-[clamp(26px,4vw,38px)] font-semibold">Bar</h2>
            {event.bar.service && (
              <p className="mx-auto mb-9 max-w-[480px] text-[16px] leading-relaxed text-ink-soft">
                {event.bar.service}
              </p>
            )}
            {event.bar.signatureName && (
              <div className="mx-auto mb-9 max-w-[420px] rounded-[20px] bg-paper-2 px-6 py-7">
                <div className="mb-1.5 text-[12px] uppercase tracking-[2.5px] text-accent">
                  Drink de assinatura
                </div>
                <div className="font-display text-[22px] font-semibold">
                  {event.bar.signatureName}
                </div>
                {event.bar.signatureDesc && (
                  <div className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                    {event.bar.signatureDesc}
                  </div>
                )}
              </div>
            )}
            {event.bar.items.length > 0 && (
              <div className="mx-auto grid max-w-[720px] gap-5 text-left sm:grid-cols-2">
                {event.bar.items.map((item, i) => (
                  <div key={`${item.name}-${i}`} className="border-t border-line pt-3.5">
                    <div className="font-display text-[17px] font-semibold">{item.name}</div>
                    {item.desc && (
                      <div className="mt-1 text-[14px] leading-relaxed text-ink-soft">
                        {item.desc}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!event.bar.service &&
              !event.bar.signatureName &&
              event.bar.items.length === 0 && (
                <p className="text-[16px] leading-relaxed text-ink-soft">
                  As informações do bar serão divulgadas em breve.
                </p>
              )}
          </section>
    ),

    // Amigo secreto
    "amigo-secreto": has("amigo-secreto") && (
          <section id="amigo-secreto" className="px-6 pb-16 pt-16 sm:px-10 sm:pb-20">
            <div className="rounded-[24px] bg-ink px-7 py-10 text-center text-paper sm:p-14">
              <div className="mb-3 text-[13px] uppercase tracking-[3px] text-accent-soft">
                Diversão à parte
              </div>
              <h2 className="mb-3.5 font-display text-[clamp(24px,4vw,32px)] font-semibold">
                Amigo Secreto
              </h2>
              <p className="mx-auto mb-6 max-w-[480px] text-[16px] leading-[1.8] text-paper/75">
                Participe do sorteio entre os convidados e leve um mimo especial para trocar no
                grande dia.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setSecretJoined((v) => !v)}
                  className={`cursor-pointer rounded-[10px] border border-paper/40 px-7 py-3.5 text-[15px] font-semibold text-paper ${
                    secretJoined ? "bg-paper/15" : "bg-accent"
                  }`}
                >
                  {secretJoined ? "Inscrição confirmada" : "Participar do sorteio"}
                </button>
                <Link
                  href={eventUrl(event, "/amigo-secreto")}
                  className="rounded-[10px] border border-paper/40 px-7 py-3.5 text-[15px] font-semibold text-paper no-underline"
                >
                  Ver meu sorteio
                </Link>
              </div>
            </div>
          </section>
    ),
  };

  return (
    <div style={themeVars(event)} className="min-h-screen bg-paper-3">
      <div className="mx-auto min-h-screen max-w-[1180px] bg-paper shadow-[0_0_80px_rgba(0,0,0,0.06)]">
        {/* Capa ------------------------------------------------------ */}
        <header className="relative h-[min(88vh,760px)] min-h-[560px] w-full">
          {event.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL assinada, de curta duração; next/image exigiria remotePatterns por ambiente.
            <img
              src={event.coverUrl}
              alt={`Foto de capa — ${event.title}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageSlot placeholder={`Foto de capa — ${event.title}`} />
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(20,18,15,0.05)_0%,rgba(20,18,15,0.15)_55%,rgba(20,18,15,0.72)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-10 text-center sm:pb-16">
            <div className="mb-3 animate-[fade-up_0.9s_ease_both] text-[13px] uppercase tracking-[3px] text-paper-2/85 sm:text-sm sm:tracking-[4px]">
              {event.eyebrow}
            </div>
            <h1 className="animate-[fade-up_0.9s_ease_0.1s_both] font-display text-[clamp(44px,9vw,96px)] font-semibold leading-[1.05] text-white">
              {event.title}
            </h1>
            <div className="mt-4 animate-[fade-up_0.9s_ease_0.2s_both] text-[16px] tracking-wide text-paper-2 sm:text-lg">
              {longDate(event.date)} &nbsp;·&nbsp; {event.venue}, {event.city}
            </div>
          </div>
        </header>

        {/* Boas-vindas + contagem ------------------------------------ */}
        <section className="grid items-center gap-10 px-6 pt-12 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-14">
          <div className="text-center lg:text-left">
            <div className="eyebrow mb-3.5">Bem-vindos</div>
            <p className="mb-6 font-display text-[clamp(19px,3vw,26px)] font-medium leading-[1.5]">
              {event.welcome}
            </p>
            <p className="mb-8 text-[16px] leading-[1.8] text-ink-soft">
              Sua presença é o presente que mais desejamos. Preparamos cada detalhe deste dia com
              carinho e mal podemos esperar para compartilhá-lo com quem amamos.
            </p>
            <Button size="lg" onClick={() => setRsvpOpen(true)}>
              Confirmar Presença
            </Button>
          </div>
          <div className="rounded-[20px] bg-paper-2 px-5 py-9">
            <Countdown iso={event.date} />
          </div>
        </section>

        {/* Navegação por módulos ------------------------------------- */}
        <nav className="mt-10 border-y border-line">
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-5 py-4 sm:justify-center sm:px-10">
            {nav.map((n) => (
              <a
                key={n.id}
                href={n.href}
                className="shrink-0 rounded-full border border-line-strong px-5 py-2.5 text-[14px] text-ink no-underline hover:bg-paper-2 sm:text-[15px]"
              >
                {n.label}
              </a>
            ))}
          </div>
        </nav>

        {sectionOrder.map((id) => (
          <Fragment key={id}>{sections[id]}</Fragment>
        ))}

        {/* Rodapé ---------------------------------------------------- */}
        <footer className="border-t border-line px-6 py-14 text-center sm:px-10">
          <div className="mb-2 font-display text-[22px]">Com carinho,</div>
          <div className="mb-5 font-display text-[28px] font-semibold">{event.hosts}</div>
          <div className="text-xs tracking-wide text-ink-faint">
            Feito com Convite · plataforma de eventos
          </div>
        </footer>
      </div>

      {/* Barra fixa de RSVP no mobile --------------------------------- */}
      <div className="sticky bottom-0 z-40 border-t border-line bg-paper/95 p-4 backdrop-blur sm:hidden">
        <Button full size="lg" onClick={() => setRsvpOpen(true)}>
          Confirmar Presença
        </Button>
      </div>

      <RsvpSheet open={rsvpOpen} onClose={() => setRsvpOpen(false)} event={event} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bottom-sheet de RSVP rápido                                         */
/* ------------------------------------------------------------------ */

function RsvpSheet({
  open,
  onClose,
  event,
}: {
  open: boolean;
  onClose: () => void;
  event: EventSummary;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"sim" | "nao">("sim");
  const [companions, setCompanions] = useState(0);
  const [kids, setKids] = useState(false);
  const [kidsCount, setKidsCount] = useState(0);
  const [dietary, setDietary] = useState("");

  const reset = () => {
    setSubmitted(false);
    setName("");
    setAttending("sim");
    setCompanions(0);
    setKids(false);
    setKidsCount(0);
    setDietary("");
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      {submitted ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-[28px] text-on-accent">
            ✓
          </div>
          <div className="mb-3 font-display text-[26px] font-semibold">
            {attending === "sim" ? "Presença confirmada!" : "Obrigado por avisar!"}
          </div>
          <p className="mb-7 text-[15px] leading-relaxed text-ink-soft">
            {attending === "sim"
              ? `Obrigado por confirmar, ${name || "convidado"}. Mal podemos esperar para celebrar com você.`
              : `Vamos sentir sua falta, ${name || "convidado"}. Obrigado por nos responder.`}
          </p>
          <Button variant="outline" onClick={reset}>
            Fechar
          </Button>
        </div>
      ) : (
        <div>
          <div className="mb-1.5 text-center font-display text-[24px] font-semibold">
            Confirmar Presença
          </div>
          <p className="mb-7 text-center text-sm text-ink-soft">
            Preencha os dados abaixo para confirmar.{" "}
            <Link href={eventUrl(event, "/rsvp")} className="text-accent underline">
              ou use o fluxo completo
            </Link>
          </p>

          <div className="mb-5">
            <Field label="Seu nome">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </Field>
          </div>

          <div className="mb-5">
            <span className="mb-2 block text-[13px] tracking-wide text-ink-soft">
              Você poderá comparecer?
            </span>
            <div className="flex gap-2.5">
              {(["sim", "nao"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setAttending(v)}
                  className={`flex-1 cursor-pointer rounded-[10px] border px-3 py-3.5 text-sm font-semibold ${
                    attending === v
                      ? "border-accent bg-accent text-on-accent"
                      : "border-[rgba(42,39,36,0.2)] bg-white text-ink"
                  }`}
                >
                  {v === "sim" ? "Sim, estarei lá" : "Não poderei ir"}
                </button>
              ))}
            </div>
          </div>

          {attending === "sim" && (
            <>
              <div className="mb-5">
                <span className="mb-2 block text-[13px] tracking-wide text-ink-soft">
                  Acompanhantes
                </span>
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
                <div className="mb-5 pl-1">
                  <Stepper value={kidsCount} onChange={setKidsCount} />
                </div>
              )}

              <div className="mb-2">
                <Field label="Restrições alimentares (opcional)">
                  <Input
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="Ex: vegetariano, alergia a nozes..."
                  />
                </Field>
              </div>
            </>
          )}

          <Button full size="lg" className="mt-4" onClick={() => setSubmitted(true)}>
            Enviar confirmação
          </Button>
        </div>
      )}
    </Sheet>
  );
}
