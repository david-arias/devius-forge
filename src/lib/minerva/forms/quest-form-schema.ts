import { z } from "zod";

/**
 * Schema de FORMULARIO (no de dominio) para una Quest — Minerva,
 * Iteración 14 (actualizado en la 16, "CMS V2", y en la 31, "Expansión
 * Global"/i18n). `QuestSchema` (`src/lib/demeter/schemas/quest.ts`) tiene
 * campos anidados (`imagePlaceholder`, `caseStudy`, `caseStudy.chapterMedia`,
 * `media`, `testimonial`) que no mapean 1:1 a un formulario plano — acá se
 * aplana lo editable a mano (los 4 capítulos del caso de estudio, el
 * placeholder de gradiente, `tech` como CSV) y `toQuestInput()` arma de
 * vuelta la forma anidada que `QuestUpsertInput` espera. `media`/
 * `testimonial`/`chapterMedia` quedan fuera del scaffold de esta
 * iteración a propósito (se completan subiendo imágenes con
 * `ImageUploader`, Iteración 15+).
 *
 * Campos `*En` (Iteración 31, i18n): la traducción al inglés de cada
 * campo traducible — SIEMPRE opcionales (`z.string().optional()`, sin
 * `.min(1)`) a propósito: una Quest puede publicarse sólo en español y
 * traducirse después, capítulo por capítulo. `QuestForm.tsx` los muestra
 * detrás de un toggle ES/EN (ver su docblock) en vez de duplicar todo el
 * formulario.
 */
export const QuestFormSchema = z.object({
  id: z.string().min(1, "El id/slug es obligatorio (se usa en /quests/[slug])."),
  title: z.string().min(1, "El título es obligatorio."),
  summary: z.string().min(1, "El resumen es obligatorio."),
  role: z.string().min(1, "El rol es obligatorio."),
  /** Tecnologías separadas por coma — se convierte a `string[]` al enviar. */
  tech: z.string().min(1, "Al menos una tecnología, separadas por coma."),
  href: z.union([z.string().url("Tiene que ser una URL válida."), z.literal("")]).optional(),
  // No se reusa `QuestSchema.shape.status` tal cual: tiene `.default("completed")`
  // en el dominio, lo que vuelve opcional el tipo de ENTRADA de Zod y rompe
  // la inferencia del `Resolver` de `zodResolver` (mismo problema que
  // `rarity` en `inventory-form-schema.ts` — ver el comentario ahí). Desde
  // la Iteración 16, `status` ya NO incluye `"draft"` — esa pregunta ahora
  // la responde `isPublished` (ver abajo), separada de "en qué fase está
  // el proyecto".
  status: z.enum(["completed", "in-progress"]),
  /** Checkbox — mismo patrón que `SkillsFormSchema.unlocked` (Iteración 16, unifica el concepto "borrador" en todo el CMS). */
  isPublished: z.boolean(),
  accentColor: z.string().min(1, "El color de acento (hex) es obligatorio."),
  placeholderFrom: z.string().min(1, "El primer stop del gradiente es obligatorio."),
  placeholderTo: z.string().min(1, "El segundo stop del gradiente es obligatorio."),
  problem: z.string().min(1, "El capítulo \"El Problema\" es obligatorio."),
  uxProcess: z.string().min(1, "El capítulo \"El Proceso UX\" es obligatorio."),
  uiSolution: z.string().min(1, "El capítulo \"La Solución UI\" es obligatorio."),
  impact: z.string().min(1, "El capítulo \"El Impacto\" es obligatorio."),
  // ── Traducciones EN (Iteración 31, i18n) — todas opcionales, ver docblock. ──
  titleEn: z.string().optional(),
  summaryEn: z.string().optional(),
  roleEn: z.string().optional(),
  problemEn: z.string().optional(),
  uxProcessEn: z.string().optional(),
  uiSolutionEn: z.string().optional(),
  impactEn: z.string().optional(),
});

export type QuestFormValues = z.infer<typeof QuestFormSchema>;

/** Convierte los valores validados del formulario a la forma de `QuestUpsertInput` (Deméter). */
export function toQuestInput(values: QuestFormValues) {
  return {
    id: values.id,
    title: values.title,
    summary: values.summary,
    role: values.role,
    tech: values.tech
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0),
    href: values.href || undefined,
    status: values.status,
    isPublished: values.isPublished,
    accentColor: values.accentColor,
    imagePlaceholder: { from: values.placeholderFrom, to: values.placeholderTo },
    caseStudy: {
      problem: values.problem,
      uxProcess: values.uxProcess,
      uiSolution: values.uiSolution,
      impact: values.impact,
    },
    titleEn: values.titleEn,
    summaryEn: values.summaryEn,
    roleEn: values.roleEn,
    caseStudyEn: {
      problem: values.problemEn,
      uxProcess: values.uxProcessEn,
      uiSolution: values.uiSolutionEn,
      impact: values.impactEn,
    },
  };
}
