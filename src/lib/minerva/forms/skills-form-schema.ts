import { z } from "zod";

/**
 * Schema de FORMULARIO (no de dominio) para un nodo del Skill Tree —
 * Minerva, Iteración 14, extendido en la 32 ("i18n Absoluto"). Espejo de
 * `SkillNodeSchema` (`src/lib/demeter/schemas/skill-node.ts`), con
 * `achievements` como string multilínea (un logro por línea) en vez de
 * `string[]` — mismo criterio que `character-form-schema.ts` para `bio`.
 *
 * Campos `*En` (Iteración 32, i18n): traducción al inglés — SIEMPRE
 * opcionales, mismo criterio que `QuestFormSchema` (`quest-form-schema.ts`).
 */
export const SkillsFormSchema = z.object({
  id: z
    .string()
    .min(1, "El id es obligatorio (slug único, p.ej. \"lead-ux-ui-engineer\")."),
  label: z.string().min(1, "El label es obligatorio."),
  period: z.string().optional(),
  description: z.string().min(1, "La descripción es obligatoria."),
  /** Un logro ("XP obtenida") por línea — opcional. */
  achievements: z.string().optional(),
  unlocked: z.boolean(),
  labelEn: z.string().optional(),
  descriptionEn: z.string().optional(),
  achievementsEn: z.string().optional(),
});

export type SkillsFormValues = z.infer<typeof SkillsFormSchema>;

/** Convierte los valores validados del formulario a la forma de `SkillNodeUpsertInput` (Deméter). */
export function toSkillNodeInput(values: SkillsFormValues) {
  return {
    id: values.id,
    label: values.label,
    period: values.period || undefined,
    description: values.description,
    achievements: values.achievements
      ? values.achievements
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : undefined,
    unlocked: values.unlocked,
    labelEn: values.labelEn,
    descriptionEn: values.descriptionEn,
    achievementsEn: values.achievementsEn
      ? values.achievementsEn
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : undefined,
  };
}
