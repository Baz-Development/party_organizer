"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ImageSlot } from "@/components/ImageSlot";
import { Logo } from "@/components/Logo";
import { PartnerStrip } from "@/components/PartnerStrip";
import { SealInvite } from "@/components/SealInvite";
import { BENEFIT_ICONS, type BenefitIconKey } from "@/components/benefit-icons";
import { CountUp, Reveal, ScrollRotate, Tilt, useInView } from "@/components/motion";
import { LinkButton, Pill } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import { landingFeatures } from "@/lib/landing-features";
import type { Partner } from "@/lib/partners";
import type { ShowcaseEvent } from "@/lib/db/featured";

const PRICE_TAGLINE = "Preço por evento — sem mensalidade eterna.";

/** Link de agendamento da call de 15 min (Calendly, Cal.com, WhatsApp...). */
const CALL_URL = process.env.NEXT_PUBLIC_CALL_URL || "https://wa.me/";

const F = landingFeatures;

const NAV = [
  { href: "#como-funciona", label: "Como funciona", on: F.howItWorks },
  { href: "#tipos-de-festa", label: "Tipos de festa", on: F.eventTypes },
  { href: "#planos", label: "Fale com a gente", on: F.plans },
  { href: "#faq", label: "FAQ", on: F.faq },
].filter((item) => item.on);

const STEPS = [
  {
    n: 1,
    title: "Escolha o tipo de festa",
    desc: "Selecione o tipo de evento e os módulos que quer usar — RSVP, presentes, amigo secreto e mais.",
  },
  {
    n: 2,
    title: "Personalize em minutos",
    desc: "Troque foto, cor e textos num editor simples. Sem precisar de designer.",
  },
  {
    n: 3,
    title: "Compartilhe o link",
    desc: "Convidados confirmam presença, votam no cardápio e escolhem presentes — tudo em um clique.",
  },
];

const EVENT_TYPES = {
  casamento: {
    label: "Casamento",
    hero: { title: "Marina & Thiago", meta: "12 dez 2026 · Itu, SP", cta: "Confirmar presença" },
    mockup: "/casamento.png",
    features: [
      "RSVP com acompanhantes e restrições",
      "Lista de presentes com cotas",
      "Amigo secreto entre os convidados",
      "Cronograma do grande dia",
    ],
  },
  debutante: {
    label: "Debutante",
    hero: { title: "15 Anos da Sofia", meta: "5 set 2026 · São Paulo, SP", cta: "Confirmar presença" },
    mockup: "/15_anos_debutante.png",
    features: [
      "Contagem regressiva para os 15 anos",
      "Votação do tema da festa",
      "Galeria de fotos colaborativa",
      "Lista de presentes personalizada",
    ],
  },
  infantil: {
    label: "Aniversário infantil",
    hero: { title: "Bento faz 5!", meta: "18 out 2026 · Campinas, SP", cta: "Confirmar presença" },
    mockup: "/bento_faz_5_anos.png",
    features: [
      "Confirmação fácil para os pais",
      "Lista de presentes por faixa etária",
      "Mural de recados carinhosos",
      "Cronograma da festinha",
    ],
  },
  corporativo: {
    label: "Corporativo",
    hero: { title: "Convenção Nexus 2026", meta: "3 nov 2026 · São Paulo, SP", cta: "Fazer check-in" },
    mockup: "/festa_fim_de_ano_empresas.png",
    features: [
      "Check-in rápido para convidados",
      "Cronograma e palestrantes",
      "Confirmação em massa por e-mail",
      "Galeria para relatório pós-evento",
    ],
  },
} as const;

type EventTypeKey = keyof typeof EVENT_TYPES;

const TYPE_KEYS = Object.keys(EVENT_TYPES) as EventTypeKey[];

/** Moldura de celular; a tela mantém a proporção do print da página. */
function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[34px] bg-ink-charcoal p-[7px] shadow-[0_30px_70px_rgba(0,0,0,0.25)] ${className}`}
    >
      <div className="relative aspect-[785/1163] overflow-hidden rounded-[27px] bg-paper">{children}</div>
      <span
        aria-hidden
        className="absolute left-1/2 top-[11px] h-[5px] w-[56px] -translate-x-1/2 rounded-full bg-ink-charcoal/80"
      />
    </div>
  );
}

/** Faíscas douradas do CTA final: posição, tamanho, deriva e tempo (fixos → sem hidratação divergente). */
const SPARKS = [
  { "--x": "8%", "--s": "4px", "--dx": "14px", "--t": "6.5s", "--d": "0s" },
  { "--x": "17%", "--s": "3px", "--dx": "-10px", "--t": "7.5s", "--d": "2.2s" },
  { "--x": "29%", "--s": "5px", "--dx": "18px", "--t": "6s", "--d": "4.1s" },
  { "--x": "41%", "--s": "3px", "--dx": "-16px", "--t": "8s", "--d": "1.1s" },
  { "--x": "55%", "--s": "4px", "--dx": "12px", "--t": "6.8s", "--d": "3.3s" },
  { "--x": "67%", "--s": "3px", "--dx": "-14px", "--t": "7.2s", "--d": "0.6s" },
  { "--x": "78%", "--s": "5px", "--dx": "10px", "--t": "6.2s", "--d": "2.8s" },
  { "--x": "90%", "--s": "4px", "--dx": "-12px", "--t": "7.8s", "--d": "4.6s" },
];

const BENEFITS: { title: string; desc: string; icon: BenefitIconKey }[] = [
  { icon: "tap", title: "Convidados confirmam presença em segundos", desc: "Sem ligação, sem grupo de WhatsApp — só um toque no link." },
  { icon: "gift", title: "Lista de presentes sem duplicidade", desc: "Cada presente é reservado uma única vez, sem graça repetida." },
  { icon: "shuffle", title: "Amigo secreto sem bagunça", desc: "Sorteio automático e revelação surpresa, sem planilha." },
  { icon: "seal", title: "Sua casa de eventos já recomenda", desc: "Feito em parceria com buffets e espaços de festa de confiança." },
  { icon: "brush", title: "Editor sem código", desc: "Troque foto, cor e texto em minutos — sem precisar de designer." },
];

const TESTIMONIALS: { name: string; role: string; quote: string; avatar: string | null }[] = [
  { name: "Marina Costa", role: "Casamento, dez 2026", avatar: null, quote: "Criei a página do nosso casamento em uma tarde. Os convidados amaram poder confirmar presença e escolher presentes pelo celular." },
  { name: "Renata Andrade", role: "Mãe de debutante", avatar: null, quote: "A votação do cardápio foi um sucesso — a Sofia adorou ver os convidados escolhendo o tema junto com ela." },
  { name: "Felipe Nogueira", role: "Organizador corporativo", avatar: null, quote: "Conseguimos confirmar presença de mais de 300 convidados em dois dias, sem uma única planilha." },
];

const FAQS = [
  { q: "Preciso saber programar?", a: "Não. Todo o editor é visual — você troca foto, cor e texto sem escrever uma linha de código." },
  { q: "Meus convidados precisam criar conta?", a: "Não. Eles acessam tudo por um link, sem cadastro ou senha." },
  { q: "Meus convidados pagam alguma coisa ou precisam de aplicativo?", a: "Não. O acesso é gratuito para o convidado e abre direto no navegador do celular — nada para instalar. Só há pagamento se ele escolher presentear pela lista de presentes." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem multa e sem burocracia." },
  { q: "Funciona para qualquer tipo de festa?", a: "Sim — casamento, debutante, aniversário infantil, corporativo e formatura." },
  { q: "Posso usar meu próprio domínio?", a: "Sim, no plano Empresas a página do evento pode rodar no domínio da sua marca." },
  { q: "Posso mudar a cor e o tema depois?", a: "Sim, quantas vezes quiser, direto pelo editor." },
];

/**
 * `demoEvent` é o evento publicado que o botão "Ver exemplo ao vivo" abre.
 * Vem do servidor porque depende do banco; sem nenhum evento publicado, o
 * botão simplesmente não aparece.
 *
 * `partners` é conteúdo de marketing (`src/lib/partners.ts`); vazio esconde a
 * faixa de logos e a frase de parceria.
 */
export function Landing({
  demoEvent,
  partners,
  partyCount,
}: {
  demoEvent: ShowcaseEvent | null;
  partners: Partner[];
  /** Já arredondado por `proofCount`; 0 esconde o contador. */
  partyCount: number;
}) {
  const [eventType, setEventType] = useState<EventTypeKey>("casamento");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const active = EVENT_TYPES[eventType];
  const activeIdx = TYPE_KEYS.indexOf(eventType);

  const pickType = (key: EventTypeKey) => {
    setAutoplay(false);
    setEventType(key);
  };

  // Enquanto o hero está na tela e ninguém escolheu um tipo, o mockup passeia
  // sozinho pelos quatro tipos de festa.
  useEffect(() => {
    if (!autoplay || !heroInView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setEventType((t) => TYPE_KEYS[(TYPE_KEYS.indexOf(t) + 1) % TYPE_KEYS.length]);
    }, 4500);
    return () => clearInterval(id);
  }, [autoplay, heroInView]);

  const heroRef = useRef<HTMLElement | null>(null);
  const finalRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [proofRef, proofOn] = useInView<HTMLDivElement>(0.5);
  const [stepsRef, stepsOn] = useInView<HTMLDivElement>(0.35);

  // Barra de progresso de leitura: escreve direto no DOM (sem re-render).
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // CTA flutuante: aparece quando o hero saiu de vista e some de novo quando o
  // CTA final entra — sem lib, só IntersectionObserver.
  useEffect(() => {
    const hero = heroRef.current;
    const final = finalRef.current;
    if (!hero) return;

    let heroVisible = true;
    let finalVisible = false;
    const sync = () => {
      setShowFloatingCta(!heroVisible && !finalVisible);
      setHeroInView(heroVisible);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === hero) heroVisible = e.isIntersecting;
          if (e.target === final) finalVisible = e.isIntersecting;
        }
        sync();
      },
      { threshold: 0.1 },
    );
    obs.observe(hero);
    if (final) obs.observe(final);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bg-paper text-ink">
      <div
        ref={progressRef}
        aria-hidden
        className="scroll-progress pointer-events-none fixed inset-x-0 top-0 z-[950] h-[3px] bg-accent"
      />

      {/* Topo -------------------------------------------------------- */}
      <header className="animate-fade-up mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-8 pt-6">
        <Logo variant="lockup" height={46} priority />
        <nav className="flex items-center gap-5 sm:gap-6">
          <div className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-ink-soft no-underline hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </div>
          <Link href="/painel" className="text-sm font-semibold text-ink-soft no-underline hover:text-ink">
            Entrar
          </Link>
        </nav>
      </header>

      {/* Hero -------------------------------------------------------- */}
      <section
        ref={heroRef}
        className="mx-auto grid max-w-[1160px] items-center gap-14 px-8 pb-18 pt-14 md:grid-cols-[1.1fr_1fr]"
      >
        <div>
          <div className="eyebrow animate-fade-up mb-4">
            Casamento · Debutante · Aniversário infantil · Corporativo · Formatura
          </div>
          <h1
            className="animate-fade-up mb-6 font-display text-[clamp(36px,6vw,52px)] font-semibold leading-[1.12]"
            style={{ animationDelay: "120ms" }}
          >
            A festa dos seus sonhos, organizada em um só lugar
          </h1>
          <p
            className="animate-fade-up mb-6 max-w-[460px] text-[18px] leading-relaxed text-ink-soft"
            style={{ animationDelay: "240ms" }}
          >
            Site do evento, confirmação de presença, lista de presentes e amigo secreto — tudo em um
            único link, lindo e fácil de compartilhar.
          </p>
          <div className="animate-fade-up flex flex-wrap gap-3" style={{ animationDelay: "360ms" }}>
            <LinkButton href={CALL_URL} target="_blank" rel="noopener noreferrer" size="lg" className="btn-sheen">
              Marcar uma call de 15 min
            </LinkButton>
            {demoEvent && (
              <LinkButton href={eventUrl(demoEvent)} size="lg" variant="outline">
                Ver exemplo ao vivo
              </LinkButton>
            )}
          </div>
          <p
            className="animate-fade-up mt-3 text-[13.5px] font-semibold text-ink-faint"
            style={{ animationDelay: "480ms" }}
          >
            {PRICE_TAGLINE}
          </p>
        </div>

        <div
          className="animate-fade-up relative flex flex-col items-center"
          style={{ animationDelay: "300ms" }}
        >
          <div
            aria-hidden
            className="hero-glow pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2"
          />
          <ScrollRotate>
            <div className="float-soft relative w-[250px]">
              <Tilt max={12} glare={false} innerClassName="rounded-[34px]">
                <PhoneFrame>
                  {TYPE_KEYS.map((k) => (
                    <Image
                      key={k}
                      src={EVENT_TYPES[k].mockup}
                      alt={`Página de evento — ${EVENT_TYPES[k].label}`}
                      fill
                      priority={k === "casamento"}
                      sizes="250px"
                      className={`object-cover object-top transition duration-700 ease-out ${
                        k === eventType ? "scale-100 opacity-100" : "scale-105 opacity-0"
                      }`}
                    />
                  ))}
                </PhoneFrame>

                {/* "Notificações" flutuando à frente do celular (translateZ) */}
                <div
                  aria-hidden
                  className="absolute -left-20 top-10 hidden lg:block"
                  style={{ transform: "translateZ(70px)" }}
                >
                  <div
                    className="chip-pop flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[12px] font-semibold shadow-[0_10px_28px_rgba(0,0,0,0.12)]"
                    style={{ "--d": "1.1s" } as React.CSSProperties}
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-ok text-[10px] text-white">✓</span>
                    Ana confirmou presença
                  </div>
                </div>
                <div
                  aria-hidden
                  className="absolute -right-16 bottom-16 hidden lg:block"
                  style={{ transform: "translateZ(110px)" }}
                >
                  <div
                    className="chip-pop flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[12px] font-semibold shadow-[0_10px_28px_rgba(0,0,0,0.12)]"
                    style={{ "--d": "1.7s" } as React.CSSProperties}
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] text-on-accent">★</span>
                    Presente reservado
                  </div>
                </div>
              </Tilt>
            </div>
          </ScrollRotate>

          <div className="mt-7 flex items-center gap-2" role="group" aria-label="Tipo de festa do exemplo">
            {TYPE_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => pickType(k)}
                aria-label={EVENT_TYPES[k].label}
                aria-pressed={k === eventType}
                className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${
                  k === eventType ? "w-6 bg-accent" : "w-2 bg-line hover:bg-ink-faint"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Prova social ------------------------------------------------ */}
      {F.proof && (partyCount > 0 || partners.length > 0) && (
      <div className="border-y border-line px-8 py-7">
        <div ref={proofRef} className="mx-auto flex max-w-[1160px] flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
            {partyCount > 0 && (
              <div className="font-display text-[22px] font-semibold tabular-nums text-ink-soft">
                +<CountUp to={partyCount} on={proofOn} duration={2000} /> festas organizadas
              </div>
            )}
            {partners.length > 0 && (
              <div className="text-sm text-ink-faint">
                Disponível em parceria com casas de eventos e buffets em todo o Brasil
              </div>
            )}
          </div>
          <PartnerStrip partners={partners} />
        </div>
      </div>
      )}

      {/* Como funciona ----------------------------------------------- */}
      {F.howItWorks && (
      <section id="como-funciona" className="mx-auto max-w-[1160px] scroll-mt-24 px-8 py-22">
        <Reveal>
          <h2 className="mb-13 text-center font-display text-[34px] font-semibold">Como funciona</h2>
        </Reveal>
        <div ref={stepsRef} className={`relative grid gap-10 sm:grid-cols-3 ${stepsOn ? "is-in" : ""}`}>
          {/* linha dourada que se desenha ligando os passos */}
          <div
            aria-hidden
            className="absolute left-[16.7%] right-[16.7%] top-6 hidden h-px bg-line sm:block"
          >
            <div className="step-line h-full bg-accent" />
          </div>
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative text-center">
              <div
                className="step-badge relative mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-accent bg-paper font-display text-[22px] font-semibold text-accent"
                style={{ "--i": i } as React.CSSProperties}
              >
                {s.n}
              </div>
              <Reveal delay={150 + i * 150}>
                <div className="mb-2.5 font-display text-[19px] font-semibold">{s.title}</div>
                <p className="mx-auto max-w-[280px] text-[15px] leading-relaxed text-ink-soft">{s.desc}</p>
              </Reveal>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Tipos de festa ---------------------------------------------- */}
      {F.eventTypes && (
      <section id="tipos-de-festa" className="scroll-mt-24 bg-paper-2 px-8 py-22">
        <div className="mx-auto max-w-[1160px]">
          <Reveal>
            <h2 className="mb-9 text-center font-display text-[34px] font-semibold">
              Feito para o seu tipo de festa
            </h2>
            <div className="mb-11 flex flex-wrap justify-center gap-2">
              {(Object.keys(EVENT_TYPES) as EventTypeKey[]).map((key) => (
                <Pill
                  key={key}
                  active={eventType === key}
                  onClick={() => pickType(key)}
                  className="active:scale-95"
                >
                  {EVENT_TYPES[key].label}
                </Pill>
              ))}
            </div>
          </Reveal>
          <div className="grid items-center gap-14 md:grid-cols-2">
            <div key={eventType} className="flex flex-col gap-4">
              {active.features.map((f, i) => (
                <div
                  key={f}
                  className="feature-in flex items-center gap-3.5"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span className="text-[16.5px]">{f}</span>
                </div>
              ))}
            </div>
            <ScrollRotate tilt={8}>
              <Tilt max={6} glare={false}>
                <div
                  className="relative mx-auto h-[360px] w-full max-w-[520px] [--step:92px] sm:[--step:150px]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {TYPE_KEYS.map((k, i) => {
                    const n = TYPE_KEYS.length;
                    let off = (i - activeIdx + n) % n;
                    if (off > n / 2) off -= n;
                    const abs = Math.abs(off);
                    const hidden = abs > 1;
                    return (
                      <button
                        key={k}
                        type="button"
                        tabIndex={hidden ? -1 : 0}
                        aria-label={`Ver exemplo: ${EVENT_TYPES[k].label}`}
                        aria-pressed={off === 0}
                        onClick={() => pickType(k)}
                        className={`absolute left-1/2 top-0 -ml-[115px] w-[230px] transition-all duration-700 ease-out ${
                          off === 0 ? "cursor-default" : "cursor-pointer hover:brightness-105"
                        }`}
                        style={{
                          transform: `translateX(calc(var(--step) * ${off})) translateZ(${-abs * 120}px) rotateY(${-off * 28}deg) scale(${off === 0 ? 1 : 0.88})`,
                          opacity: hidden ? 0 : off === 0 ? 1 : 0.75,
                          zIndex: 10 - abs * 5,
                          pointerEvents: hidden ? "none" : "auto",
                        }}
                      >
                        <PhoneFrame>
                          <Image
                            src={EVENT_TYPES[k].mockup}
                            alt={`Página de evento — ${EVENT_TYPES[k].label}`}
                            fill
                            sizes="230px"
                            className="object-cover object-top"
                          />
                        </PhoneFrame>
                      </button>
                    );
                  })}
                </div>
              </Tilt>
            </ScrollRotate>
          </div>
        </div>
      </section>
      )}

      {/* Benefícios --------------------------------------------------- */}
      {F.benefits && (
      <section className="mx-auto max-w-[1160px] px-8 py-22">
        <Reveal>
          <h2 className="mb-13 text-center font-display text-[34px] font-semibold">
            Por que escolher a Convite
          </h2>
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => {
            const Icon = BENEFIT_ICONS[b.icon];
            return (
              <Reveal key={b.title} delay={(i % 3) * 120}>
                <div className="group">
                  <div className="mb-4 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-[1.5px] border-accent text-accent transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-on-accent">
                    <Icon className="h-[20px] w-[20px]" />
                  </div>
                  <div className="mb-2 font-display text-[18px] font-semibold">{b.title}</div>
                  <p className="text-[15px] leading-relaxed text-ink-soft">{b.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      )}

      {/* Depoimentos -------------------------------------------------- */}
      {F.testimonials && (
      <section className="bg-paper-2 px-8 py-22">
        <div className="mx-auto max-w-[1000px]">
          <Reveal>
            <h2 className="mb-13 text-center font-display text-[34px] font-semibold">
              Quem já viveu essa experiência
            </h2>
          </Reveal>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 140}>
                <Tilt max={6} className="h-full" innerClassName="h-full rounded-[18px]">
                <div className="h-full rounded-[18px] bg-paper p-7 transition duration-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
                  <div className="mb-4 h-[52px] w-[52px] overflow-hidden rounded-full">
                    <ImageSlot neutral shape="circle" src={t.avatar} placeholder={`Foto de ${t.name}`} />
                  </div>
                  <p className="mb-4 font-display text-[17px] italic leading-relaxed">“{t.quote}”</p>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[13px] text-ink-faint">{t.role}</div>
                </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Planos ------------------------------------------------------- */}
      {F.plans && (
      <section id="planos" className="mx-auto max-w-[1160px] scroll-mt-24 px-8 py-22">
        <Reveal>
          <h2 className="mb-4 text-center font-display text-[34px] font-semibold">
            Cansou de convite padrão? Rompa o lacre.
          </h2>
          <p className="mx-auto mb-3 max-w-[560px] text-center text-[16px] text-ink-soft">
            Descubra uma nova forma de convidar: uma experiência que seus convidados abrem, sentem e não esquecem.
          </p>
          <div className="mb-14" />
        </Reveal>
        <Reveal delay={140}>
          <SealInvite callUrl={CALL_URL} />
        </Reveal>
      </section>
      )}

      {/* FAQ ---------------------------------------------------------- */}
      {F.faq && (
      <section id="faq" className="mx-auto max-w-[800px] scroll-mt-24 px-8 py-22">
        <Reveal>
          <h2 className="mb-11 text-center font-display text-[34px] font-semibold">
            Perguntas frequentes
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <div className="flex flex-col gap-px overflow-hidden rounded-[14px] bg-line">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="bg-paper">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-5.5 py-5 text-left transition-colors hover:bg-paper-2"
                  >
                    <span className="text-[16px] font-semibold">{f.q}</span>
                    <span
                      aria-hidden
                      className={`text-lg transition duration-300 ${
                        open ? "rotate-45 text-accent" : "text-ink-faint"
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    inert={!open}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5.5 pb-5 text-[15px] leading-relaxed text-ink-soft">{f.a}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </section>
      )}

      {/* CTA final ---------------------------------------------------- */}
      {F.finalCta && (
      <section
        ref={finalRef}
        className="relative overflow-hidden bg-ink-charcoal px-8 py-22 text-center"
      >
        <div
          aria-hidden
          className="cta-halo pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {SPARKS.map((s, i) => (
            <span key={i} className="spark" style={s as React.CSSProperties} />
          ))}
        </div>
        <Reveal className="relative">
          <Logo variant="mark" height={76} className="mx-auto mb-7" />
          <h2 className="mb-6 font-display text-[clamp(26px,5vw,36px)] font-semibold text-paper">
            Sua história merece uma página à altura.
          </h2>
          <LinkButton href={CALL_URL} target="_blank" rel="noopener noreferrer" size="lg" className="btn-sheen">
            Marcar uma call de 15 min
          </LinkButton>
        </Reveal>
      </section>
      )}

      {/* Rodapé ------------------------------------------------------- */}
      <footer className="bg-ink-charcoal px-8 pb-12 pt-2 text-paper">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-6 border-t border-[rgba(245,243,238,0.12)] pt-8">
          <Logo variant="lockup" height={36} />
          <nav className="flex flex-wrap gap-7 text-sm">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-paper-2 no-underline hover:text-paper">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>

      {/* CTA flutuante --------------------------------------------------- */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[800] flex justify-center px-4 pb-4 transition-all duration-300 ${
          showFloatingCta ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <LinkButton
          href={CALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shadow-[0_12px_32px_rgba(0,0,0,0.24)]"
        >
          Marcar uma call de 15 min
        </LinkButton>
      </div>
    </div>
  );
}
