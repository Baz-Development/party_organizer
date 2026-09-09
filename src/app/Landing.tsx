"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ImageSlot } from "@/components/ImageSlot";
import { Logo } from "@/components/Logo";
import { PartnerStrip } from "@/components/PartnerStrip";
import { BENEFIT_ICONS, type BenefitIconKey } from "@/components/benefit-icons";
import { LinkButton, Pill } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import type { Partner } from "@/lib/partners";
import type { ShowcaseEvent } from "@/lib/db/featured";

const PRICE_TAGLINE = "Preço por evento — sem mensalidade eterna.";

const NAV = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#tipos-de-festa", label: "Tipos de festa" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
];

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
    mockup: null as string | null,
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
    mockup: null as string | null,
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
    mockup: null as string | null,
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
    mockup: null as string | null,
    features: [
      "Check-in rápido para convidados",
      "Cronograma e palestrantes",
      "Confirmação em massa por e-mail",
      "Galeria para relatório pós-evento",
    ],
  },
} as const;

type EventTypeKey = keyof typeof EVENT_TYPES;

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

const PLANS = [
  { name: "Essencial", price: "R$ 49", features: ["Página do evento", "RSVP", "Galeria de fotos", "Editor sem código"], cta: "Começar", featured: false },
  { name: "Premium", price: "R$ 129", features: ["Tudo do Essencial", "Lista de presentes", "Amigo Secreto", "Votação de cardápio", "Cor personalizada"], cta: "Criar minha página", featured: true },
  { name: "Empresas", price: "Sob consulta", features: ["Múltiplos eventos", "Suporte dedicado", "Marca e domínio próprios", "Relatórios de presença"], cta: "Falar com a equipe", featured: false },
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
}: {
  demoEvent: ShowcaseEvent | null;
  partners: Partner[];
}) {
  const [eventType, setEventType] = useState<EventTypeKey>("casamento");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const active = EVENT_TYPES[eventType];

  const heroRef = useRef<HTMLElement | null>(null);
  const finalRef = useRef<HTMLElement | null>(null);

  // CTA flutuante: aparece quando o hero saiu de vista e some de novo quando o
  // CTA final entra — sem lib, só IntersectionObserver.
  useEffect(() => {
    const hero = heroRef.current;
    const final = finalRef.current;
    if (!hero || !final) return;

    let heroVisible = true;
    let finalVisible = false;
    const sync = () => setShowFloatingCta(!heroVisible && !finalVisible);

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
    obs.observe(final);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bg-paper text-ink">
      {/* Topo -------------------------------------------------------- */}
      <header className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-8 pt-6">
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
          <div className="eyebrow mb-4">
            Casamento · Debutante · Aniversário infantil · Corporativo · Formatura
          </div>
          <h1 className="mb-6 font-display text-[clamp(36px,6vw,52px)] font-semibold leading-[1.12]">
            A festa dos seus sonhos, organizada em um só lugar
          </h1>
          <p className="mb-6 max-w-[460px] text-[18px] leading-relaxed text-ink-soft">
            Site do evento, confirmação de presença, lista de presentes e amigo secreto — tudo em um
            único link, lindo e fácil de compartilhar.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/onboarding" size="lg">
              Criar minha página do evento
            </LinkButton>
            {demoEvent && (
              <LinkButton href={eventUrl(demoEvent)} size="lg" variant="outline">
                Ver exemplo ao vivo
              </LinkButton>
            )}
          </div>
          <p className="mt-3 text-[13.5px] font-semibold text-ink-faint">{PRICE_TAGLINE}</p>
        </div>

        <div className="relative flex justify-center">
          <div className="w-[250px] overflow-hidden rounded-[22px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.14)]">
            <div className="relative h-[300px] w-full">
              <ImageSlot
                neutral
                src={active.mockup}
                placeholder={`Página de evento — ${active.label}`}
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(20,18,15,0.05)_0%,rgba(20,18,15,0.7)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-center">
                <div className="font-display text-xl font-semibold text-white">{active.hero.title}</div>
                <div className="mt-1 text-[11px] text-paper-2">{active.hero.meta}</div>
              </div>
            </div>
            <div className="p-3.5">
              <div className="rounded-lg bg-accent px-3 py-2.5 text-center text-[12.5px] font-semibold text-on-accent">
                {active.hero.cta}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prova social ------------------------------------------------ */}
      <div className="border-y border-line px-8 py-7">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
            <div className="font-display text-[22px] font-semibold text-ink-soft">
              +2.000 festas organizadas
            </div>
            {partners.length > 0 && (
              <div className="text-sm text-ink-faint">
                Disponível em parceria com casas de eventos e buffets em todo o Brasil
              </div>
            )}
          </div>
          <PartnerStrip partners={partners} />
        </div>
      </div>

      {/* Como funciona ----------------------------------------------- */}
      <section id="como-funciona" className="mx-auto max-w-[1160px] scroll-mt-24 px-8 py-22">
        <h2 className="mb-13 text-center font-display text-[34px] font-semibold">Como funciona</h2>
        <div className="grid gap-10 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mb-3.5 font-display text-[44px] font-semibold text-accent">{s.n}</div>
              <div className="mb-2.5 font-display text-[19px] font-semibold">{s.title}</div>
              <p className="mx-auto max-w-[280px] text-[15px] leading-relaxed text-ink-soft">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tipos de festa ---------------------------------------------- */}
      <section id="tipos-de-festa" className="scroll-mt-24 bg-paper-2 px-8 py-22">
        <div className="mx-auto max-w-[1160px]">
          <h2 className="mb-9 text-center font-display text-[34px] font-semibold">
            Feito para o seu tipo de festa
          </h2>
          <div className="mb-11 flex flex-wrap justify-center gap-2">
            {(Object.keys(EVENT_TYPES) as EventTypeKey[]).map((key) => (
              <Pill key={key} active={eventType === key} onClick={() => setEventType(key)}>
                {EVENT_TYPES[key].label}
              </Pill>
            ))}
          </div>
          <div className="grid items-center gap-14 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              {active.features.map((f) => (
                <div key={f} className="flex items-center gap-3.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span className="text-[16.5px]">{f}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="h-[280px] w-[220px] overflow-hidden rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                <ImageSlot neutral src={active.mockup} placeholder={`Mockup — ${active.label}`} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios --------------------------------------------------- */}
      <section className="mx-auto max-w-[1160px] px-8 py-22">
        <h2 className="mb-13 text-center font-display text-[34px] font-semibold">
          Por que escolher a Convite
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => {
            const Icon = BENEFIT_ICONS[b.icon];
            return (
              <div key={b.title}>
                <div className="mb-4 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-[1.5px] border-accent text-accent">
                  <Icon className="h-[20px] w-[20px]" />
                </div>
                <div className="mb-2 font-display text-[18px] font-semibold">{b.title}</div>
                <p className="text-[15px] leading-relaxed text-ink-soft">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Depoimentos -------------------------------------------------- */}
      <section className="bg-paper-2 px-8 py-22">
        <div className="mx-auto max-w-[1000px]">
          <h2 className="mb-13 text-center font-display text-[34px] font-semibold">
            Quem já viveu essa experiência
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-[18px] bg-paper p-7">
                <div className="mb-4 h-[52px] w-[52px] overflow-hidden rounded-full">
                  <ImageSlot neutral shape="circle" src={t.avatar} placeholder={`Foto de ${t.name}`} />
                </div>
                <p className="mb-4 font-display text-[17px] italic leading-relaxed">“{t.quote}”</p>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-[13px] text-ink-faint">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos ------------------------------------------------------- */}
      <section id="planos" className="mx-auto max-w-[1160px] scroll-mt-24 px-8 py-22">
        <h2 className="mb-4 text-center font-display text-[34px] font-semibold">
          Planos simples, sem pegadinha
        </h2>
        <p className="mb-12 text-center text-[16px] text-ink-soft">{PRICE_TAGLINE}</p>
        <div className="mx-auto grid max-w-[940px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-[20px] bg-paper p-8 ${
                p.featured
                  ? "border-2 border-accent shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
                  : "border border-line"
              }`}
            >
              {p.featured && (
                <div className="mb-4 inline-block rounded-full bg-accent px-3.5 py-1.5 text-[11.5px] font-semibold text-on-accent">
                  Mais popular
                </div>
              )}
              <div className="mb-2 font-display text-[22px] font-semibold">{p.name}</div>
              <div className="mb-5 font-display text-[32px] font-semibold">{p.price}</div>
              <div className="mb-7 flex flex-col gap-2.5">
                {p.features.map((f) => (
                  <div key={f} className="text-[14.5px] text-ink-2">
                    ✓ {f}
                  </div>
                ))}
              </div>
              <LinkButton href="/onboarding" full variant={p.featured ? "primary" : "outline"}>
                {p.cta}
              </LinkButton>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ ---------------------------------------------------------- */}
      <section id="faq" className="mx-auto max-w-[800px] scroll-mt-24 px-8 py-22">
        <h2 className="mb-11 text-center font-display text-[34px] font-semibold">
          Perguntas frequentes
        </h2>
        <div className="flex flex-col gap-px overflow-hidden rounded-[14px] bg-line">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className="bg-paper">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5.5 py-5 text-left"
                >
                  <span className="text-[16px] font-semibold">{f.q}</span>
                  <span className="text-lg text-ink-faint">{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <div className="px-5.5 pb-5 text-[15px] leading-relaxed text-ink-soft">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA final ---------------------------------------------------- */}
      <section ref={finalRef} className="bg-ink-charcoal px-8 py-22 text-center">
        <Logo variant="mark" height={76} className="mx-auto mb-7" />
        <h2 className="mb-4 font-display text-[clamp(26px,5vw,36px)] font-semibold text-paper">
          Sua história merece uma página à altura.
        </h2>
        <LinkButton href="/onboarding" size="lg">
          Criar minha página do evento
        </LinkButton>
      </section>

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
          href="/onboarding"
          className="shadow-[0_12px_32px_rgba(0,0,0,0.24)]"
        >
          Criar minha página do evento
        </LinkButton>
      </div>
    </div>
  );
}
