export type EventKind =
  | "casamento"
  | "debutante"
  | "corporativo"
  | "aniversario"
  | "formatura"
  | "confraternizacao"
  | "outros";

export type ModuleId =
  | "rsvp"
  | "cronograma"
  | "local"
  | "presentes"
  | "galeria"
  | "mural"
  | "cardapio"
  | "amigo-secreto";

export type ThemeKey = "oliva" | "terracota" | "marinho" | "dourado";

export interface Theme {
  key: ThemeKey;
  label: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
}

export interface ScheduleItem {
  time: string;
  title: string;
  desc: string;
}

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  kind: EventKind;
  /** ISO date-time */
  date: string;
  venue: string;
  city: string;
  hosts: string;
  eyebrow: string;
  welcome: string;
  themeKey: ThemeKey;
  modules: ModuleId[];
  schedule: ScheduleItem[];
  gallery: string[];
  status: "rascunho" | "publicado" | "encerrado";
  /** ISO date-time. Ausente = respostas aceitas até o evento ser encerrado. */
  rsvpDeadline?: string;
  /** Permite RSVP de gente não cadastrada; cria convidado marcado como `unlisted`. */
  guestListOpen: boolean;
  /** Aprovação prévia ou publicação imediata para envios de convidado (galeria/mural). */
  moderationPolicy: ModerationPolicy;
  /** Path do objeto no bucket `event-media`. `undefined` quando não há capa. */
  coverPath?: string;
  /** URL assinada da capa, resolvida por quem carrega o evento — `undefined` até ser resolvida. */
  coverUrl?: string;
}

export type UserRole = "cliente" | "admin";

/** Identidade da plataforma. O convidado não tem perfil — ele não tem conta. */
export interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** A conta foi provisionada pelo admin (convite), não pelo self-service. */
  provisioned: boolean;
  createdAt: string;
}

export type RsvpStatus = "confirmado" | "recusado" | "pendente";

export interface Guest {
  id: string;
  name: string;
  group: string;
  email?: string;
  phone?: string;
  status: RsvpStatus;
  companions: number;
  kids: number;
  dietary?: string;
  invitedAt: string;
  respondedAt?: string;
  /** Criado pelo próprio RSVP de lista aberta, sem ter sido cadastrado antes. */
  unlisted?: boolean;
}

export type GiftStatus = "disponivel" | "reservado" | "comprado";

export interface Gift {
  id: string;
  name: string;
  category: string;
  price: number;
  /** cota: presente dividido entre vários convidados */
  quota?: { target: number; raised: number };
  status: GiftStatus;
  reservedBy?: string;
  store?: string;
  note?: string;
}

export type ModerationPolicy = "previa" | "imediata";
export type MediaStatus = "pendente" | "aprovada" | "oculta";

export interface Photo {
  id: string;
  author: string;
  caption?: string;
  /** ISO date-time. */
  at: string;
  likes: number;
  status: MediaStatus;
  /** URL assinada, de curta duração — resolvida no momento da listagem. */
  url: string;
}

export interface MuralMessage {
  id: string;
  author: string;
  message: string;
  /** ISO date-time. */
  at: string;
  likes: number;
  status: MediaStatus;
  /** URL assinada da foto anexada, de curta duração. `undefined` quando o recado não tem foto. */
  photoUrl?: string;
}

export interface MenuOption {
  id: string;
  name: string;
  desc: string;
  votes: number;
  tags: string[];
}

export interface MenuPoll {
  id: string;
  course: string;
  question: string;
  closesAt: string;
  maxChoices: number;
  options: MenuOption[];
}

export interface SecretSantaParticipant {
  id: string;
  name: string;
  wishlist: string[];
  joinedAt: string;
  hasDrawn: boolean;
}

export interface Activity {
  id: string;
  at: string;
  who: string;
  what: string;
  kind: "rsvp" | "presente" | "foto" | "mural" | "sistema";
}
