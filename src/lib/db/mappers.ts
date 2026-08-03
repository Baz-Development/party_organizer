import type { Database } from "@/lib/database.types";
import type {
  EventSummary,
  Gift,
  Guest,
  ModuleId,
  Organization,
  OrganizationMember,
  Profile,
  ScheduleItem,
} from "@/lib/types";

/**
 * Fronteira `snake_case` ⇄ `camelCase`.
 *
 * O banco fala `snake_case` e os tipos de domínio em `src/lib/types.ts` falam
 * `camelCase`. A tradução acontece aqui e em nenhum outro lugar — páginas e
 * rotas só enxergam o domínio, então trocar uma coluna de nome afeta este
 * arquivo e mais nada.
 */

type Tables = Database["public"]["Tables"];

type EventRow = Tables["events"]["Row"];
type OrganizationRow = Tables["organizations"]["Row"];
type ProfileRow = Tables["profiles"]["Row"];
export type GuestRow = Tables["guests"]["Row"];
export type GiftRow = Tables["gifts"]["Row"];

export type EventRowWithContent = EventRow & {
  event_modules: Pick<Tables["event_modules"]["Row"], "module">[];
  schedule_items: Pick<
    Tables["schedule_items"]["Row"],
    "position" | "time" | "title" | "description"
  >[];
};

/**
 * Ordem em que os módulos aparecem na página do evento. O banco devolve os
 * módulos como conjunto, sem ordem; sem isto a página reordenaria seções entre
 * um carregamento e outro.
 */
const MODULE_ORDER: ModuleId[] = [
  "rsvp",
  "cronograma",
  "local",
  "presentes",
  "galeria",
  "mural",
  "cardapio",
  "amigo-secreto",
];

export function toEventSummary(row: EventRowWithContent): EventSummary {
  const modules = row.event_modules
    .map((m) => m.module)
    .sort((a, b) => MODULE_ORDER.indexOf(a) - MODULE_ORDER.indexOf(b));

  const schedule = [...row.schedule_items]
    .sort((a, b) => a.position - b.position)
    .map(toScheduleItem);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    date: row.event_at,
    venue: row.venue ?? "",
    city: row.city ?? "",
    hosts: row.hosts ?? "",
    eyebrow: row.eyebrow ?? "",
    welcome: row.welcome ?? "",
    themeKey: row.theme_key,
    modules,
    schedule,
    // A galeria pertence ao módulo de mídia, que ainda não tem tabela. Até o
    // change `add-media-backend`, quem precisa dela compõe com a fixture de
    // `src/lib/fixtures/`.
    gallery: [],
    status: row.status,
    organizationId: row.organization_id ?? undefined,
    rsvpDeadline: row.rsvp_deadline ?? undefined,
    guestListOpen: row.guest_list_open,
  };
}

function toScheduleItem(
  row: EventRowWithContent["schedule_items"][number],
): ScheduleItem {
  return {
    time: row.time,
    title: row.title,
    desc: row.description ?? "",
  };
}

export function toOrganization(
  row: OrganizationRow,
  counts: { events: number; activeEvents: number },
): Organization {
  return {
    id: row.id,
    name: row.name,
    city: row.city ?? "",
    plan: row.plan,
    events: counts.events,
    activeEvents: counts.activeEvents,
    contact: row.contact ?? "",
    since: row.since,
  };
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function toGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    name: row.name,
    group: row.group_name ?? "",
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    status: row.status,
    companions: row.companions,
    kids: row.kids,
    dietary: row.dietary ?? undefined,
    invitedAt: row.invited_at,
    respondedAt: row.responded_at ?? undefined,
    unlisted: row.unlisted,
  };
}

/** Dinheiro sai do banco em centavos; o domínio fala em reais. */
export const centsToReais = (cents: number): number => Math.round(cents) / 100;

/**
 * `reservedBy` só é passado por `src/lib/db/gifts.ts` quando quem chama
 * administra o evento — a fronteira de privacidade
 * ("Requirement: Visibilidade do estado do presente") vive na consulta que monta
 * esse argumento, não aqui.
 */
export function toGift(row: GiftRow, reservedBy?: string): Gift {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: centsToReais(row.price_cents),
    quota:
      row.quota_target_cents != null
        ? { target: centsToReais(row.quota_target_cents), raised: centsToReais(row.quota_raised_cents) }
        : undefined,
    status: row.status,
    reservedBy,
    store: row.store ?? undefined,
    note: row.note ?? undefined,
  };
}

export function toOrganizationMember(row: {
  organization_id: string;
  profile_id: string;
  role: Database["public"]["Enums"]["org_member_role"];
  profiles: Pick<ProfileRow, "email" | "display_name"> | null;
}): OrganizationMember {
  return {
    organizationId: row.organization_id,
    profileId: row.profile_id,
    role: row.role,
    email: row.profiles?.email ?? "",
    displayName: row.profiles?.display_name ?? row.profiles?.email ?? "",
  };
}
