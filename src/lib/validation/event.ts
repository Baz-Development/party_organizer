import { z } from "zod";

/**
 * Validação de entrada das rotas que escrevem evento.
 *
 * Roda antes de tocar o banco para que um campo faltando vire um 400 que diz
 * qual campo é, em vez de um erro de constraint do Postgres que vaza nome de
 * coluna e não ajuda quem chamou.
 */

export const EVENT_KINDS = [
  "casamento",
  "debutante",
  "infantil",
  "corporativo",
  "formatura",
] as const;

export const EVENT_STATUSES = ["rascunho", "publicado", "encerrado"] as const;

export const THEME_KEYS = ["oliva", "terracota", "marinho", "dourado"] as const;

export const MODERATION_POLICIES = ["previa", "imediata"] as const;

export const MODULE_IDS = [
  "rsvp",
  "cronograma",
  "local",
  "presentes",
  "galeria",
  "mural",
  "cardapio",
  "amigo-secreto",
] as const;

/**
 * Aceita qualquer data que o runtime saiba interpretar e normaliza para ISO.
 * Os mocks usam `2026-12-12T16:00:00`, sem fuso, e formulários mandam o que o
 * `<input type="datetime-local">` produzir.
 */
const eventDate = z
  .string()
  .min(1, "Informe a data do evento.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida.")
  .transform((value) => new Date(value).toISOString());

const scheduleItem = z.object({
  time: z.string().trim().min(1, "Informe o horário do item."),
  title: z.string().trim().min(1, "Informe o título do item."),
  desc: z.string().trim().default(""),
});

const optionalText = z.string().trim().max(2000).optional();

export const createEventSchema = z.object({
  kind: z.enum(EVENT_KINDS, { message: "Tipo de evento desconhecido." }),
  title: z.string().trim().min(1, "Informe o título do evento.").max(120),
  date: eventDate,
  venue: optionalText,
  city: optionalText,
  hosts: optionalText,
  // Slug informado é opcional: sem ele, derivamos do título.
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens.",
    )
    .max(60)
    .optional(),
  modules: z.array(z.enum(MODULE_IDS)).optional(),
});

/**
 * Criação pelo admin: além dos campos do evento, o corpo traz a conta de
 * cliente que será anfitriã. Quem valida que esse id é mesmo de um `cliente`
 * é a rota (com uma mensagem clara) e, em última instância, a política de
 * `events_insert`.
 */
export const createEventByAdminSchema = createEventSchema.extend({
  hostProfileId: z.string().uuid("Escolha uma conta de cliente anfitriã."),
});

/**
 * Aceita data/hora, string vazia (limpa o prazo) ou ausência (não altera).
 * Validação de "não é passado" fica a cargo de quem chama, que conhece a
 * data de criação do evento a comparar.
 */
const rsvpDeadline = z
  .string()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Prazo inválido.")
  .transform((value) => (value === "" ? null : new Date(value).toISOString()))
  .optional();

export const updateEventSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  date: eventDate.optional(),
  venue: optionalText,
  city: optionalText,
  hosts: optionalText,
  eyebrow: optionalText,
  welcome: optionalText,
  themeKey: z.enum(THEME_KEYS, { message: "Tema de cor não suportado." }).optional(),
  rsvpDeadline,
  guestListOpen: z.boolean().optional(),
  moderationPolicy: z.enum(MODERATION_POLICIES, {
    message: "Política de moderação desconhecida.",
  }).optional(),
});

export const eventStatusSchema = z.enum(EVENT_STATUSES, {
  message: "Estado de evento desconhecido.",
});

export const eventModulesSchema = z.array(
  z.enum(MODULE_IDS, { message: "Módulo desconhecido." }),
);

export const eventScheduleSchema = z.array(scheduleItem);

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateEventByAdminInput = z.infer<typeof createEventByAdminSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
