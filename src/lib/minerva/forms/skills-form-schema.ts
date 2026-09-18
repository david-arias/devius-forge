import { z } from "zod";

/**
 * Schema de FORMULARIO (no de dominio) para un nodo del Skill Tree —
 * Minerva, Iteración 14. Espejo de `SkillNodeSchema`
 * (`src/lib/demeter/schemas/skill-node.ts`), con `achievements` como
 * string multilínea (un logro por línea) en vez de `string[]` — mismo
 * criterio que `character-form-schema.ts` para `bio`.
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
});

export type SkillsFormValues = z.infer<typeof SkillsFormSchema>;

/** Convierte los valores validados del formulario a la forma de `SkillNode` (Deméter). */
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
  };
}
