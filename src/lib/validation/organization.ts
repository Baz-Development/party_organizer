import { z } from "zod";

export const ORG_PLANS = ["parceiro", "premium", "enterprise"] as const;

export const ORG_MEMBER_ROLES = ["proprietario", "colaborador"] as const;

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da organização.").max(120),
  plan: z.enum(ORG_PLANS, { message: "Informe um plano válido." }),
  city: z.string().trim().max(120).optional(),
  contact: z.string().trim().max(200).optional(),
  since: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD.")
    .optional(),
});

export const addMemberSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  role: z.enum(ORG_MEMBER_ROLES).default("colaborador"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
