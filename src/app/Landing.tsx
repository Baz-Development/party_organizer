"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageSlot } from "@/components/ImageSlot";
import { LinkButton, Pill } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import type { ShowcaseEvent } from "@/lib/db/featured";

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
    features: [
      "RSVP com acompanhantes e restrições",
      "Lista de presentes com cotas",
      "Amigo secreto entre os convidados",
      "Cronograma do grande dia",
    ],
  },
  debutante: {
    label: "Debutante",
    features: [
      "Contagem regressiva para os 15 anos",
      "Votação do tema da festa",
      "Galeria de fotos colaborativa",
      "Lista de presentes personalizada",
    ],
  },
  infantil: {
    label: "Aniversário infantil",
    features: [
      "Confirmação fácil para os pais",
      "Lista de presentes por faixa etária",
      "Mural de recados carinhosos",
      "Cronograma da festinha",
    ],
  },
  corporativo: {
    label: "Corporativo",
    features: [
      "Check-in rápido para convidados",
      "Cronograma e palestrantes",
      "Confirmação em massa por e-mail",
      "Galeria para relatório pós-evento",
    ],
  },
} as const;

type EventTypeKey = keyof typeof EVENT_TYPES;

const BENEFITS = [
  { title: "Convidados confirmam presença em segundos", desc: "Sem ligação, sem grupo de WhatsApp — só um toque no link." },
  { title: "Lista de presentes sem duplicidade", desc: "Cada presente é reservado uma única vez, sem graça repetida." },
  { title: "Amigo secreto sem bagunça", desc: "Sorteio automático e revelação surpresa, sem planilha." },
  { title: "Sua casa de eventos já recomenda", desc: "Feito em parceria com buffets e espaços de festa de confiança." },
  { title: "Editor sem código", desc: "Troque foto, cor e texto em minutos — sem precisar de designer." },
];

const TESTIMONIALS = [
  { name: "Marina Costa", role: "Casamento, dez 2026", quote: "Criei a página do nosso casamento em uma tarde. Os convidados amaram poder confirmar presença e escolher presentes pelo celular." },
  { name: "Renata Andrade", role: "Mãe de debutante", quote: "A votação do cardápio foi um sucesso — a Sofia adorou ver os convidados escolhendo o tema junto com ela." },
  { name: "Felipe Nogueira", role: "Organizador corporativo", quote: "Conseguimos confirmar presença de mais de 300 convidados em dois dias, sem uma única planilha." },
];

const PLANS = [
  { name: "Essencial", price: "R$ 49", features: ["Página do evento", "RSVP", "Galeria de fotos", "Editor sem código"], cta: "Começar", featured: false },
  { name: "Premium", price: "R$ 129", features: ["Tudo do Essencial", "Lista de presentes", "Amigo Secreto", "Votação de cardápio", "Cor personalizada"], cta: "Criar minha página", featured: true },
  { name: "Corporativo", price: "Sob consulta", features: ["Múltiplos eventos", "Suporte dedicado", "Marca própria", "Relatórios de presença"], cta: "Falar com a equipe", featured: false },
];

const FAQS = [
  { q: "Preciso saber programar?", a: "Não. Todo o editor é visual — você troca foto, cor e texto sem escrever uma linha de código." },
  { q: "Meus convidados precisam criar conta?", a: "Não. Eles acessam tudo por um link, sem cadastro ou senha." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem multa e sem burocracia." },
  { q: "Funciona para qualquer tipo de festa?", a: "Sim — casamento, debutante, aniversário infantil, corporativo e formatura." },
  { q: "Minha casa de eventos já é parceira, preciso pagar de novo?", a: "Não. Se sua casa de eventos participa do programa de parceiros, seu acesso já está incluso." },
  { q: "Posso mudar a cor e o tema depois?", a: "Sim, quantas vezes quiser, direto pelo editor." },
];

/**
 * `demoEvent` é o evento publicado que o botão "Ver exemplo ao vivo" abre.
 * Vem do servidor porque depende do banco; sem nenhum evento publicado, o
 * botão simplesmente não aparece.
 */
export function Landing({ demoEvent }: { demoEvent: ShowcaseEvent | null }) {
  const [eventType, setEventType] = useState<EventTypeKey>("casamento");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const active = EVENT_TYPES[eventType];

  return (
    <div className="bg-paper text-ink">
      {/* Topo -------------------------------------------------------- */}
      <header className="mx-auto flex max-w-[1160px] items-center justify-between px-8 pt-6">
        <div className="font-display text-xl font-semibold">Convite</div>
        <nav className="flex items-center gap-6">
          <a href="#parceiros" className="text-sm font-semibold text-ink-soft no-underline hover:text-ink">
            Sou uma casa de eventos
          </a>
          <Link href="/painel" className="text-sm font-semibold text-ink-soft no-underline hover:text-ink">
            Entrar
          </Link>
        </nav>
      </header>

      {/* Hero -------------------------------------------------------- */}
      <section className="mx-auto grid max-w-[1160px] items-center gap-14 px-8 pb-18 pt-14 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="mb-6 font-display text-[clamp(36px,6vw,52px)] font-semibold leading-[1.12]">
            A festa dos seus sonhos, organizada em um só lugar
          </h1>
          <p className="mb-8 max-w-[460px] text-[18px] leading-relaxed text-ink-soft">
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
        </div>

        <div className="relative flex justify-center">
          <div className="w-[250px] overflow-hidden rounded-[22px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.14)]">
            <div className="relative h-[300px] w-full">
              <ImageSlot placeholder="Foto de capa" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(20,18,15,0.05)_0%,rgba(20,18,15,0.7)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-center">
                <div className="font-display text-xl font-semibold text-white">Marina &amp; Thiago</div>
                <div className="mt-1 text-[11px] text-paper-2">12 dez 2026 · Itu, SP</div>
              </div>
            </div>
            <div className="p-3.5">
              <div className="rounded-lg bg-accent px-3 py-2.5 text-center text-[12.5px] font-semibold text-on-accent">
                Confirmar Presença
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prova social ------------------------------------------------ */}
      <div className="border-y border-line px-8 py-7">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-center gap-x-12 gap-y-3">
          <div className="font-display text-[22px] font-semibold text-ink-soft">
            +2.000 festas organizadas
          </div>
          <div className="text-sm text-ink-faint">
            Disponível em parceria com casas de eventos e buffets em todo o Brasil
          </div>
        </div>
      </div>

      {/* Como funciona ----------------------------------------------- */}
      <section className="mx-auto max-w-[1160px] px-8 py-22">
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
      <section className="bg-paper-2 px-8 py-22">
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
                <ImageSlot placeholder={`Mockup — ${active.label}`} />
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
          {BENEFITS.map((b) => (
            <div key={b.title}>
              <div className="mb-4 h-[38px] w-[38px] rounded-[10px] border-[1.5px] border-accent" />
              <div className="mb-2 font-display text-[18px] font-semibold">{b.title}</div>
              <p className="text-[15px] leading-relaxed text-ink-soft">{b.desc}</p>
            </div>
          ))}
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
                  <ImageSlot shape="circle" placeholder="Foto" compact />
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
      <section className="mx-auto max-w-[1160px] px-8 py-22">
        <h2 className="mb-4 text-center font-display text-[34px] font-semibold">
          Planos simples, sem pegadinha
        </h2>
        <p className="mb-12 text-center text-[16px] text-ink-soft">
          Preço por evento, sem mensalidade eterna.
        </p>
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

      {/* Parceiros ---------------------------------------------------- */}
      <section id="parceiros" className="bg-paper-3 px-8 py-12">
        <div className="mx-auto flex max-w-[840px] flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-1 text-[16px] font-semibold">É uma casa de eventos ou buffet?</div>
            <div className="text-[14.5px] text-ink-soft">
              Ofereça isso como diferencial para seus clientes.
            </div>
          </div>
          <LinkButton href="/organizacao" variant="outline">
            Conhecer o programa de parceiros
          </LinkButton>
        </div>
      </section>

      {/* FAQ ---------------------------------------------------------- */}
      <section className="mx-auto max-w-[800px] px-8 py-22">
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
      <section className="bg-ink px-8 py-22 text-center">
        <h2 className="mb-4 font-display text-[clamp(26px,5vw,36px)] font-semibold text-paper">
          Sua história merece uma página à altura.
        </h2>
        <LinkButton href="/onboarding" size="lg">
          Criar minha página do evento
        </LinkButton>
      </section>

      {/* Rodapé ------------------------------------------------------- */}
      <footer className="px-8 py-12">
        <div className="mx-auto flex max-w-[1160px] flex-wrap justify-between gap-6">
          <div className="font-display text-[18px] font-semibold">Convite</div>
          <div className="flex flex-wrap gap-7 text-sm text-ink-soft">
            <Link href="/rotas" className="text-ink-soft no-underline hover:text-ink">
              Todas as telas
            </Link>
            <Link href="/painel" className="text-ink-soft no-underline hover:text-ink">
              Painel do cliente
            </Link>
            <Link href="/organizacao" className="text-ink-soft no-underline hover:text-ink">
              Painel da organização
            </Link>
            <Link href="/admin" className="text-ink-soft no-underline hover:text-ink">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
