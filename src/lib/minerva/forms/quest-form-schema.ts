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
/**
 * Formato de slug válido para `/quests/[slug]` — minúsculas, números y
 * guiones únicamente, sin `/` (Next.js lo leería como otro segmento de
 * ruta = 404 garantizado), sin espacios/acentos (frágiles en una URL
 * aunque el navegador los codifique). `QuestForm.tsx` normaliza el input
 * en vivo con `slugify()` (`lib/utils.ts`) así que en la práctica casi
 * nunca se ve este mensaje — queda como red de seguridad si alguien
 * pega/edita el valor evitando el `onChange` (autofill, devtools, etc.).
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const QuestFormSchema = z.object({
  id: z
    .string()
    .min(1, "El id/slug es obligatorio (se usa en /quests/[slug]).")
    .regex(SLUG_PATTERN, "Sólo minúsculas, números y guiones (sin espacios, acentos ni \"/\") — es la URL pública."),
  /**
   * Id que tenía la Quest ANTES de este guardado — string vacío en la
   * Quest "Nueva" (Iteración 34, ver `upsertQuest` en
   * `quests.mutations.ts` para el porqué: sin esto, renombrar un slug
   * existente deja un registro huérfano en vez de renombrarlo).
   */
  originalId: z.string().optional(),
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
  // ── Media (Iteración 34, Hefesto/Éter — "Expansión de Media") ──
  // URLs públicas del bucket `quest-images` (Supabase Storage), llenadas
  // por `ImageUploader` vía `setValue()` — ver `QuestForm.tsx`. Vacío =
  // sigue sin foto real, cae al placeholder de gradiente/ícono de
  // siempre (ninguno de estos campos es obligatorio).
  coverImageUrl: z.string().optional(),
  chapterImageProblem: z.string().optional(),
  chapterImageUxProcess: z.string().optional(),
  chapterImageUiSolution: z.string().optional(),
  chapterImageImpact: z.string().optional(),
  // ── Scroll-Bound Video (Iteración 39, Deméter/Éter) — vacío = sin video. ──
  heroVideoUrl: z.string().optional(),
});

export type QuestFormValues = z.infer<typeof QuestFormSchema>;

/** `url` (string) → `QuestMedia` (Iteración 34) — `alt` cae al título/eyebrow del capítulo, nunca queda vacío (accesibilidad). */
function toMedia(url: string | undefined, alt: string) {
  return url && url.trim().length > 0 ? { type: "image" as const, src: url, alt } : undefined;
}

/** Convierte los valores validados del formulario a la forma de `QuestUpsertInput` (Deméter). */
export function toQuestInput(values: QuestFormValues) {
  const chapterMedia = {
    problem: toMedia(values.chapterImageProblem, `${values.title} — El Problema`),
    uxProcess: toMedia(values.chapterImageUxProcess, `${values.title} — El Proceso UX`),
    uiSolution: toMedia(values.chapterImageUiSolution, `${values.title} — La Solución UI`),
    impact: toMedia(values.chapterImageImpact, `${values.title} — El Impacto`),
  };

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
    media: toMedia(values.coverImageUrl, values.title),
    heroVideoUrl: values.heroVideoUrl && values.heroVideoUrl.trim().length > 0 ? values.heroVideoUrl.trim() : undefined,
    caseStudy: {
      problem: values.problem,
      uxProcess: values.uxProcess,
      uiSolution: values.uiSolution,
      impact: values.impact,
      chapterMedia,
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
