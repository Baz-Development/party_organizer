export type EventKind = "casamento" | "debutante" | "infantil" | "corporativo" | "formatura";

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
  organizationId?: string;
}

export type UserRole = "cliente" | "organizacao" | "admin";

/** Identidade da plataforma. O convidado não tem perfil — ele não tem conta. */
export interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export type OrgMemberRole = "proprietario" | "colaborador";

export interface OrganizationMember {
  profileId: string;
  organizationId: string;
  role: OrgMemberRole;
  email: string;
  displayName: string;
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

export interface Photo {
  id: string;
  author: string;
  caption?: string;
  at: string;
  likes: number;
  approved: boolean;
}

export interface MuralMessage {
  id: string;
  author: string;
  message: string;
  at: string;
  likes: number;
  approved: boolean;
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

export interface Organization {
  id: string;
  name: string;
  city: string;
  plan: "parceiro" | "premium" | "enterprise";
  events: number;
  activeEvents: number;
  contact: string;
  since: string;
}

export interface Activity {
  id: string;
  at: string;
  who: string;
  what: string;
  kind: "rsvp" | "presente" | "foto" | "mural" | "sistema";
}
