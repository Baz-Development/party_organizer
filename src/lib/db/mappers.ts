import type { Database } from "@/lib/database.types";
import type {
  BarItem,
  EventSummary,
  Gift,
  Guest,
  MenuItem,
  ModuleId,
  MuralMessage,
  Photo,
  Profile,
  ScheduleItem,
  SecretSantaParticipant,
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
type ProfileRow = Tables["profiles"]["Row"];
export type GuestRow = Tables["guests"]["Row"];
export type PhotoRow = Tables["photos"]["Row"];
export type MuralMessageRow = Tables["mural_messages"]["Row"];
export type GiftRow = Tables["gifts"]["Row"];

export type EventRowWithContent = EventRow & {
  event_modules: Pick<Tables["event_modules"]["Row"], "module">[];
  schedule_items: Pick<
    Tables["schedule_items"]["Row"],
    "position" | "time" | "title" | "description"
  >[];
  menu_items: Pick<
    Tables["menu_items"]["Row"],
    "position" | "course" | "name" | "description"
  >[];
  bar_items: Pick<Tables["bar_items"]["Row"], "position" | "name" | "description">[];
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
  "bar",
  "amigo-secreto",
];

export function toEventSummary(row: EventRowWithContent): EventSummary {
  const modules = row.event_modules
    .map((m) => m.module)
    .sort((a, b) => MODULE_ORDER.indexOf(a) - MODULE_ORDER.indexOf(b));

  const schedule = [...row.schedule_items]
    .sort((a, b) => a.position - b.position)
    .map(toScheduleItem);

  const menu = [...row.menu_items]
    .sort((a, b) => a.position - b.position)
    .map(toMenuItem);

  const barItems = [...row.bar_items]
    .sort((a, b) => a.position - b.position)
    .map(toBarItem);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    hostProfileId: row.host_profile_id,
    // `infantil` foi migrado para `aniversario` e não é mais ofertado, mas o
    // valor segue no enum do banco — resolve qualquer linha remanescente.
    kind: row.kind === "infantil" ? "aniversario" : row.kind,
    date: row.event_at,
    venue: row.venue ?? "",
    city: row.city ?? "",
    address: row.address ?? undefined,
    postalCode: row.postal_code ?? undefined,
    hosts: row.hosts ?? "",
    eyebrow: row.eyebrow ?? "",
    welcome: row.welcome ?? "",
    themeKey: row.theme_key,
    accentColor: row.accent_color ?? undefined,
    accentTextColor: row.accent_text_color ?? undefined,
    backgroundColor: row.background_color ?? undefined,
    modules,
    schedule,
    menu,
    bar: {
      service: row.bar_service ?? undefined,
      signatureName: row.bar_signature_name ?? undefined,
      signatureDesc: row.bar_signature_desc ?? undefined,
      items: barItems,
    },
    // A galeria em si é paginada e carregada à parte (src/lib/db/media.ts);
    // este campo alimenta só a prévia da página pública do evento, resolvida
    // por quem chama `toEventSummary` quando precisa dela.
    gallery: [],
    status: row.status,
    rsvpDeadline: row.rsvp_deadline ?? undefined,
    selfSignupToken: row.self_signup_token,
    moderationPolicy: row.moderation_policy,
    coverPath: row.cover_path ?? undefined,
    secretSanta: {
      budget: row.secret_santa_budget ?? undefined,
      drawDate: row.secret_santa_draw_date ?? undefined,
      exchangeDate: row.secret_santa_exchange_date ?? undefined,
      rules: row.secret_santa_rules ?? undefined,
    },
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

function toMenuItem(row: EventRowWithContent["menu_items"][number]): MenuItem {
  return {
    course: row.course,
    name: row.name,
    desc: row.description ?? "",
  };
}

function toBarItem(row: EventRowWithContent["bar_items"][number]): BarItem {
  return {
    name: row.name,
    desc: row.description ?? "",
  };
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? row.email,
    role: row.role,
    provisioned: row.provisioned,
    createdAt: row.created_at,
  };
}

/** `inviteUrl` chega resolvida por quem chama — depende do evento e da env do
 * site, não é derivável só da linha do convidado. */
export function toGuest(row: GuestRow, inviteUrl?: string): Guest {
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
    inviteUrl,
  };
}

/** `url` chega resolvida por quem chama — mapper fica síncrono, a URL assinada não é. */
export function toPhoto(row: PhotoRow, url: string): Photo {
  return {
    id: row.id,
    author: row.author,
    caption: row.caption ?? undefined,
    at: row.created_at,
    likes: row.likes_count,
    status: row.status,
    url,
  };
}

/** `photoUrl` chega resolvida por quem chama — a URL assinada não é síncrona. */
export function toMuralMessage(row: MuralMessageRow, photoUrl?: string): MuralMessage {
  return {
    id: row.id,
    author: row.author,
    message: row.message,
    at: row.created_at,
    likes: row.likes_count,
    status: row.status,
    photoUrl: photoUrl || undefined,
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

/**
 * `wishlist`/`hasDrawn` chegam resolvidos por quem chama
 * (`src/lib/db/secretSanta.ts`): a wishlist mora em `secret_santa_wishlists`,
 * tabela separada por sigilo, e `hasDrawn` reflete o sorteio do evento, não
 * uma coluna do participante.
 */
export function toSecretSantaParticipant(
  row: { id: string; display_name: string; joined_at: string },
  wishlist: string[],
  hasDrawn: boolean,
): SecretSantaParticipant {
  return {
    id: row.id,
    name: row.display_name,
    wishlist,
    joinedAt: row.joined_at,
    hasDrawn,
  };
}
