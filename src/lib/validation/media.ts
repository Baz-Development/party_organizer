import { z } from "zod";

/**
 * Validação de entrada das rotas de galeria, mural e capa.
 */

export const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const COVER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const visitorId = z.uuid("Identificação de visitante inválida.");
const guestToken = z.string().trim().min(1).max(200).optional();

export const requestPhotoUploadSchema = z.object({
  visitorId,
  contentType: z.enum(PHOTO_MIME_TYPES, { message: "Formato de imagem não suportado." }),
});

export const confirmPhotoUploadSchema = z.object({
  visitorId,
  guestToken,
  storagePath: z.string().trim().min(1, "Caminho do arquivo ausente."),
  author: z.string().trim().max(120).optional(),
  caption: z.string().trim().max(300).optional(),
});

export const submitMuralMessageSchema = z.object({
  visitorId,
  guestToken,
  author: z.string().trim().max(120).optional(),
  message: z
    .string()
    .trim()
    .min(1, "Escreva uma mensagem.")
    .max(1000, "O recado excede o limite de caracteres."),
});

export const reactionTargetSchema = z.enum(["foto", "recado"], {
  message: "Tipo de item desconhecido.",
});

export const reactSchema = z.object({
  visitorId,
});

export const moderateItemSchema = z.object({
  status: z.enum(["aprovada", "oculta"], { message: "Estado de moderação desconhecido." }),
});

export const requestCoverUploadSchema = z.object({
  contentType: z.enum(COVER_MIME_TYPES, { message: "Formato de imagem não suportado." }),
});

export const confirmCoverUploadSchema = z.object({
  storagePath: z.string().trim().min(1, "Caminho do arquivo ausente.").nullable(),
});

export const galleryQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type RequestPhotoUploadInput = z.infer<typeof requestPhotoUploadSchema>;
export type ConfirmPhotoUploadInput = z.infer<typeof confirmPhotoUploadSchema>;
export type SubmitMuralMessageInput = z.infer<typeof submitMuralMessageSchema>;
export type ModerateItemInput = z.infer<typeof moderateItemSchema>;
