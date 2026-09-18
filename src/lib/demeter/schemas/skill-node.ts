import { z } from "zod";

/** SkillNode = nodo del Skill Tree (experiencia laboral / habilidades). Dominio Deméter. */
export const SkillNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  period: z.string().optional(),
  description: z.string(),
  /** "XP obtenida" — logros concretos y medibles de este nodo, en formato bitácora de misión. */
  achievements: z.array(z.string()).optional(),
  unlocked: z.boolean().default(true),
});

export type SkillNode = z.infer<typeof SkillNodeSchema>;
