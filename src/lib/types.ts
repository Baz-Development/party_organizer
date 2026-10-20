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
  | "bar"
  | "amigo-secreto"
  /** Sorteio de prêmios conduzido pela anfitriã — só painel, sem seção pública. */
  | "sorteios";

export type ThemeKey = "oliva" | "terracota" | "marinho" | "dourado";

export interface Theme {
  key: ThemeKey;
  label: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  /** Cor do texto/ícone sobre um fundo `accent` — clara em temas escuros, escura em temas claros. */
  onAccent: string;
}

/** Um item do cronograma, agrupado na página pelo bloco (`title`). */
export interface ScheduleItem {
  time: string;
  /** Bloco do dia: "Cerimônia", "Recepção", "Jantar"... */
  title: string;
  desc: string;
}

/** Um prato do cardápio, agrupado na página pela etapa (`course`). */
export interface MenuItem {
  /** Etapa da refeição: "Entrada", "Prato principal", "Sobremesa"... */
  course: string;
  name: string;
  desc: string;
}

/** Uma bebida da carta do bar. */
export interface BarItem {
  name: string;
  desc: string;
}

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  /** Conta de cliente anfitriã (`profiles.id`). */
  hostProfileId: string;
  kind: EventKind;
  /** ISO date-time */
  date: string;
  venue: string;
  city: string;
  /** Endereço completo (rua, número, bairro) — alimenta o mapa e o link de rota. */
  address?: string;
  /** CEP do local, formato livre (`00000-000`). */
  postalCode?: string;
  hosts: string;
  eyebrow: string;
  welcome: string;
  themeKey: ThemeKey;
  /**
   * Cor de destaque personalizada (hex `#rrggbb`), fora dos 4 temas prontos.
   * Presente = sobrescreve o `accent` do tema; ausente = usa o preset de
   * `themeKey`.
   */
  accentColor?: string;
  /** Cor do texto sobre `accentColor`. Só faz sentido junto de `accentColor`. */
  accentTextColor?: string;
  /** Cor de fundo da tela (atrás do cartão de conteúdo), hex `#rrggbb`. Ausente = fundo padrão. */
  backgroundColor?: string;
  modules: ModuleId[];
  schedule: ScheduleItem[];
  /** Pratos do cardápio, na ordem definida pelo anfitrião. */
  menu: MenuItem[];
  /** Conteúdo da seção Bar: serviço, drink de assinatura e carta de bebidas. */
  bar: {
    /** Texto livre: "Open bar a noite toda", "Bar pago", "Carta de vinhos"... */
    service?: string;
    /** Drink de assinatura da festa — nome e descrição, ambos opcionais juntos. */
    signatureName?: string;
    signatureDesc?: string;
    items: BarItem[];
  };
  /** Prévia das fotos aprovadas: `url` é assinada e de curta duração. */
  gallery: { id: string; url: string; label: string }[];
  status: "rascunho" | "publicado" | "encerrado";
  /** ISO date-time. Ausente = respostas aceitas até o evento ser encerrado. */
  rsvpDeadline?: string;
  /**
   * Token do link de auto-cadastro do evento (`?lista=<token>`), que habilita
   * RSVP de gente não cadastrada. `null` quando o auto-cadastro está desligado.
   * Só é preenchido para quem administra o evento — nunca chega ao público.
   */
  selfSignupToken: string | null;
  /** Aprovação prévia ou publicação imediata para envios de convidado (galeria/mural). */
  moderationPolicy: ModerationPolicy;
  /** Path do objeto no bucket `event-media`. `undefined` quando não há capa. */
  coverPath?: string;
  /** URL assinada da capa, resolvida por quem carrega o evento — `undefined` até ser resolvida. */
  coverUrl?: string;
  /**
   * Sugestão do anfitrião para o amigo secreto — tudo opcional, o módulo
   * funciona sem nenhum campo preenchido (só não mostra a sugestão ao
   * convidado).
   */
  secretSanta: {
    budget?: string;
    /** ISO date (`YYYY-MM-DD`), sem horário — é só uma data do calendário. */
    drawDate?: string;
    exchangeDate?: string;
    rules?: string;
  };
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
  /** Criado pelo próprio RSVP de auto-cadastro, sem ter sido cadastrado antes. */
  unlisted?: boolean;
  /**
   * Link de convite com o token deste convidado, pronto para compartilhar
   * (copiar / WhatsApp). Só chega a quem administra o evento.
   */
  inviteUrl?: string;
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
  /** URL assinada, de curta duração — resolvida na listagem. */
  imageUrl?: string;
  /** Path no Storage; só o painel precisa dele (para manter ou trocar a foto). */
  imagePath?: string;
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

export interface SecretSantaParticipant {
  id: string;
  name: string;
  wishlist: string[];
  joinedAt: string;
  hasDrawn: boolean;
}

export type RaffleStatus = "aberto" | "em_andamento" | "encerrado";

/**
 * Quem concorre: `selecionados` = marcados à mão pela anfitriã; `todos` = toda
 * a lista de convidados; `confirmados` = só quem confirmou presença. Nos dois
 * últimos a lista é montada pelo banco quando o sorteio começa.
 */
export type RaffleParticipantMode = "selecionados" | "todos" | "confirmados";

/** Um prêmio do sorteio. `quantity` = quantos vencedores levam este prêmio. */
export interface RafflePrize {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  /** Ordem em que o prêmio é sorteado no palco (crescente). */
  position: number;
  /** URL assinada, de curta duração. */
  imageUrl?: string;
  /** Path no Storage; só o painel precisa dele (para manter ou trocar a foto). */
  imagePath?: string;
}

export interface RaffleParticipant {
  id: string;
  /** `undefined` quando o convidado foi removido depois de entrar no sorteio. */
  guestId?: string;
  name: string;
}

export interface RaffleResult {
  id: string;
  participantId: string;
  name: string;
  /** `undefined` = suplente. */
  prizeId?: string;
  sequence: number;
  /** `ausente`: foi sorteado mas não estava presente — a vaga voltou a ficar livre. */
  status: "valido" | "ausente";
  /** ISO date-time. */
  drawnAt: string;
}

/** Linha da listagem de sorteios do evento. */
export interface RaffleSummary {
  id: string;
  title: string;
  description?: string;
  status: RaffleStatus;
  participantMode: RaffleParticipantMode;
  alternatesCount: number;
  /**
   * Quem concorre. Num modo automático ainda aberto, é a prévia (convidados
   * elegíveis agora) — a lista definitiva só é gravada ao começar.
   */
  participantCount: number;
  /** Soma das quantidades dos prêmios — quantos vencedores o sorteio terá. */
  winnerSlots: number;
  /** Resultados válidos já sorteados (vencedores + suplentes). */
  drawnCount: number;
  createdAt: string;
}

export interface Raffle extends RaffleSummary {
  prizes: RafflePrize[];
  participants: RaffleParticipant[];
  results: RaffleResult[];
}

export interface Activity {
  id: string;
  at: string;
  who: string;
  what: string;
  kind: "rsvp" | "presente" | "foto" | "mural" | "sistema";
}
