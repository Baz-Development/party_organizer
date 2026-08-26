"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageSlot } from "@/components/ImageSlot";
import { PanelNav } from "@/components/PanelNav";
import { SairButton } from "@/components/SairButton";
import { Button, Input, Sheet } from "@/components/ui";
import { eventUrl } from "@/lib/event-url";
import { themeVars } from "@/lib/themes";
import type { EventSummary, Organization } from "@/lib/types";
import { useNow } from "@/lib/use-now";

type Tab = "catalogo" | "enderecos" | "eventos";
type Category = "bebida" | "prato" | "sobremesa";

const CATEGORY_LABEL: Record<Category, string> = {
  bebida: "Bebida",
  prato: "Prato principal",
  sobremesa: "Sobremesa",
};

interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  price: string;
}

interface Address {
  id: string;
  name: string;
  address: string;
}

/**
 * Catálogo e endereços ainda não têm tabela — são estado local desta tela,
 * como no protótipo. A **agenda de eventos** e o cabeçalho da organização já
 * vêm do banco.
 */
const INITIAL_CATALOG: CatalogItem[] = [
  { id: "c1", name: "Caipirinha de limão", category: "bebida", price: "R$ 18" },
  { id: "c2", name: "Gin tônica", category: "bebida", price: "R$ 24" },
  { id: "c3", name: "Filé ao molho madeira", category: "prato", price: "R$ 62" },
  { id: "c4", name: "Risoto de camarão", category: "prato", price: "R$ 58" },
  { id: "c5", name: "Petit gâteau", category: "sobremesa", price: "R$ 22" },
  { id: "c6", name: "Torta de limão", category: "sobremesa", price: "R$ 18" },
];

const INITIAL_ADDRESSES: Address[] = [
  { id: "a1", name: "Salão Principal", address: "Estrada Municipal, km 4 — Itu, SP" },
  { id: "a2", name: "Jardim de Inverno", address: "Estrada Municipal, km 4, anexo — Itu, SP" },
];

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const STATUS_LABEL: Record<EventSummary["status"], string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  encerrado: "Encerrado",
};

export function OrganizacaoPanel({
  org,
  events,
}: {
  org: Organization;
  events: EventSummary[];
}) {
  const [tab, setTab] = useState<Tab>("catalogo");
  const [catalogFilter, setCatalogFilter] = useState<Category | "todos">("todos");
  const [eventFilter, setEventFilter] = useState<"todos" | "proximos" | "passados">("todos");

  const [catalog, setCatalog] = useState(INITIAL_CATALOG);
  const [addresses, setAddresses] = useState(INITIAL_ADDRESSES);

  const [itemModal, setItemModal] = useState(false);
  const [newItem, setNewItem] = useState<{ name: string; category: Category; price: string }>({
    name: "",
    category: "bebida",
    price: "",
  });

  const [addressModal, setAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: "", address: "" });

  const now = useNow();
  const visibleEvents = events.filter((ev) => {
    const t = new Date(ev.date).getTime();
    if (eventFilter === "proximos") return t >= now;
    if (eventFilter === "passados") return t < now;
    return true;
  });

  const visibleCatalog = catalog.filter(
    (it) => catalogFilter === "todos" || it.category === catalogFilter,
  );

  return (
    <div style={themeVars("terracota")} className="min-h-screen bg-paper-3">
      <PanelNav
        brand="Convite · Parceiros"
        items={[
          { href: "/organizacao", label: "Organização" },
          { href: "/painel", label: "Painel do cliente" },
        ]}
        right={<SairButton />}
      />

      <div className="mx-auto max-w-[1120px] px-6 py-10 pb-16">
        <div className="mb-2">
          <div className="mb-1.5 text-[13px] uppercase tracking-[2px] text-accent">{org.name}</div>
          <h1 className="font-display text-[30px] font-semibold">Painel da Organização</h1>
          <p className="mt-2 text-[14.5px] text-ink-soft">
            {org.city} · plano {org.plan} · {org.activeEvents} eventos ativos de {org.events} no
            total
          </p>
        </div>

        {/* Abas ------------------------------------------------------- */}
        <div className="my-8 flex w-fit gap-2 rounded-full bg-paper-2 p-1">
          {(
            [
              ["catalogo", "Catálogo"],
              ["enderecos", "Endereços"],
              ["eventos", "Eventos"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold ${
                tab === key ? "bg-ink text-paper" : "text-ink-soft"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Catálogo ---------------------------------------------------- */}
        {tab === "catalogo" && (
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3.5">
              <div className="flex flex-wrap gap-2">
                {(["todos", "bebida", "prato", "sobremesa"] as const).map((f) => (
                  <FilterPill
                    key={f}
                    active={catalogFilter === f}
                    onClick={() => setCatalogFilter(f)}
                  >
                    {f === "todos" ? "Todos" : `${CATEGORY_LABEL[f]}s`}
                  </FilterPill>
                ))}
              </div>
              <Button onClick={() => setItemModal(true)}>Adicionar item</Button>
            </div>

            <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
              {visibleCatalog.map((it) => (
                <div
                  key={it.id}
                  className="overflow-hidden rounded-2xl bg-paper shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
                >
                  <div className="aspect-[4/3] w-full">
                    <ImageSlot placeholder={it.name} compact />
                  </div>
                  <div className="p-4">
                    <div className="mb-1.5 text-[11.5px] uppercase tracking-wider text-ink-faint">
                      {CATEGORY_LABEL[it.category]}
                    </div>
                    <div className="mb-1 font-display text-[17px] font-semibold">{it.name}</div>
                    <div className="text-sm text-ink-soft">{it.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Endereços --------------------------------------------------- */}
        {tab === "enderecos" && (
          <div>
            <div className="mb-5 flex justify-end">
              <Button onClick={() => setAddressModal(true)}>Adicionar endereço</Button>
            </div>

            <div className="flex flex-col gap-5">
              {addresses.map((ad) => (
                <div
                  key={ad.id}
                  className="grid items-center gap-6 rounded-[18px] bg-paper p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)] lg:grid-cols-[1fr_1fr_220px]"
                >
                  <div>
                    <div className="mb-1.5 font-display text-[19px] font-semibold">{ad.name}</div>
                    <div className="text-sm leading-relaxed text-ink-soft">{ad.address}</div>
                  </div>
                  <div className="h-[140px] overflow-hidden rounded-xl">
                    <ImageSlot placeholder="Mapa do local" compact />
                  </div>
                  <div className="rounded-2xl bg-paper-3 p-4">
                    <div className="mb-2.5 text-[11px] uppercase tracking-wider text-ink-faint">
                      Prévia para o convidado
                    </div>
                    <Link
                      href="#"
                      className="inline-block rounded-full border border-[rgba(42,39,36,0.25)] bg-white px-5 py-2.5 text-[13.5px] text-ink no-underline"
                    >
                      Ver rota no mapa
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eventos ----------------------------------------------------- */}
        {tab === "eventos" && (
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {(
                [
                  ["todos", "Todos"],
                  ["proximos", "Próximos"],
                  ["passados", "Já realizados"],
                ] as const
              ).map(([key, label]) => (
                <FilterPill
                  key={key}
                  active={eventFilter === key}
                  onClick={() => setEventFilter(key)}
                >
                  {label}
                </FilterPill>
              ))}
            </div>

            <div className="flex flex-col gap-px overflow-hidden rounded-2xl bg-line">
              {visibleEvents.map((ev) => {
                const when = new Date(ev.date);
                return (
                  <Link
                    key={ev.id}
                    href={eventUrl(ev)}
                    className="flex items-center gap-6 bg-paper px-6 py-5 text-ink no-underline hover:bg-paper-2"
                  >
                    <div className="w-14 shrink-0 text-center">
                      <div className="font-display text-[22px] font-semibold">
                        {when.getDate()}
                      </div>
                      <div className="text-[11.5px] uppercase tracking-wide text-ink-faint">
                        {MONTHS[when.getMonth()]}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-0.5 text-[16px] font-semibold">{ev.title}</div>
                      <div className="text-[13.5px] text-ink-soft">
                        {ev.venue || ev.city || "Local a definir"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13.5px] font-semibold text-accent">
                        {STATUS_LABEL[ev.status]}
                      </div>
                      <div className="text-xs text-ink-faint">/e/{ev.slug}</div>
                    </div>
                  </Link>
                );
              })}
              {visibleEvents.length === 0 && (
                <div className="bg-paper px-6 py-12 text-center text-[15px] text-ink-faint">
                  Nenhum evento nesse filtro.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal — novo item ---------------------------------------------- */}
      <Sheet open={itemModal} onClose={() => setItemModal(false)} maxWidth={420}>
        <div className="mb-5 font-display text-[22px] font-semibold">
          Adicionar item ao catálogo
        </div>
        <label className="mb-2 block text-[13px] text-ink-soft">Nome</label>
        <Input
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          placeholder="Ex: Caipirinha de limão"
          className="mb-4 px-3.5 py-3 text-[14.5px]"
        />
        <label className="mb-2 block text-[13px] text-ink-soft">Categoria</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => setNewItem({ ...newItem, category: c })}
              className={`cursor-pointer rounded-lg border px-3.5 py-2.5 text-[13px] font-semibold ${
                newItem.category === c
                  ? "border-accent bg-accent text-on-accent"
                  : "border-[rgba(42,39,36,0.15)] bg-white text-ink"
              }`}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <label className="mb-2 block text-[13px] text-ink-soft">Preço (opcional)</label>
        <Input
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          placeholder="R$ 0,00"
          className="mb-6 px-3.5 py-3 text-[14.5px]"
        />
        <Button
          full
          disabled={newItem.name.trim().length === 0}
          onClick={() => {
            setCatalog((c) => [
              ...c,
              {
                id: `c-${Date.now()}`,
                name: newItem.name.trim(),
                category: newItem.category,
                price: newItem.price.trim() || "—",
              },
            ]);
            setNewItem({ name: "", category: "bebida", price: "" });
            setItemModal(false);
          }}
        >
          Salvar item
        </Button>
      </Sheet>

      {/* Modal — novo endereço ------------------------------------------ */}
      <Sheet open={addressModal} onClose={() => setAddressModal(false)} maxWidth={420}>
        <div className="mb-5 font-display text-[22px] font-semibold">Adicionar endereço</div>
        <label className="mb-2 block text-[13px] text-ink-soft">Nome do espaço</label>
        <Input
          value={newAddress.name}
          onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
          placeholder="Ex: Salão de festas"
          className="mb-4 px-3.5 py-3 text-[14.5px]"
        />
        <label className="mb-2 block text-[13px] text-ink-soft">Endereço completo</label>
        <Input
          value={newAddress.address}
          onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
          placeholder="Rua, número, cidade"
          className="mb-6 px-3.5 py-3 text-[14.5px]"
        />
        <Button
          full
          disabled={!newAddress.name.trim() || !newAddress.address.trim()}
          onClick={() => {
            setAddresses((a) => [
              ...a,
              {
                id: `a-${Date.now()}`,
                name: newAddress.name.trim(),
                address: newAddress.address.trim(),
              },
            ]);
            setNewAddress({ name: "", address: "" });
            setAddressModal(false);
          }}
        >
          Salvar endereço
        </Button>
      </Sheet>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-4 py-2.5 text-[13.5px] font-semibold ${
        active
          ? "border-accent bg-accent text-on-accent"
          : "border-[rgba(42,39,36,0.15)] bg-paper text-ink-soft hover:bg-paper-2"
      }`}
    >
      {children}
    </button>
  );
}
