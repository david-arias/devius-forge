import { z } from "zod";
import { QuestSchema, type Quest } from "@/lib/demeter/schemas";

/**
 * Esquema preparatorio de Supabase (Deméter/Eleuthia/Éter, Iteración 12).
 * Deja "la mesa servida" para cuando conectes el proyecto real en
 * supabase.com: el DDL de abajo (tabla + RLS + bucket) es el que hay que
 * correr en el SQL Editor de Supabase, y `SupabaseQuestRowSchema` +
 * `mapSupabaseQuestRow` son el adaptador real que se enchufa en
 * `fetchQuestsFromSource` (`src/lib/demeter/queries/quests.ts`, patrón de
 * repositorio de la Iteración 10) el día que eso pase — nada de UI cambia.
 *
 * ────────────────────────────────────────────────────────────────────────
 * DDL — tabla `quests`, RLS y bucket `quest-images`
 * ────────────────────────────────────────────────────────────────────────
 *
 * El script SQL completo y listo para pegar en el SQL Editor de Supabase
 * vive en `src/lib/supabase/sql/001_init.sql` (Iteración 13) — se movió
 * ahí, en vez de duplicarlo en este comentario, para que exista una única
 * fuente de verdad y no queden dos copias del DDL pudiendo desincronizarse.
 * Ese archivo cubre: la tabla `quests` completa (con trigger de
 * `updated_at`), RLS (lectura pública / escritura sólo autenticado), y el
 * bucket `quest-images` con sus políticas — con la misma convención de
 * paths documentada ahí.
 */

const questMediaRowSchema = z.object({
  type: z.enum(["image", "video"]),
  src: z.string(),
  alt: z.string(),
  poster: z.string().optional(),
});

/** Forma de `case_study` (y `case_study_en`) — factorizada para no repetirla dos veces. */
const caseStudyRowSchema = z.object({
  problem: z.string(),
  ux_process: z.string(),
  ui_solution: z.string(),
  impact: z.string(),
  chapter_media: z
    .object({
      problem: questMediaRowSchema.optional(),
      ux_process: questMediaRowSchema.optional(),
      ui_solution: questMediaRowSchema.optional(),
      impact: questMediaRowSchema.optional(),
    })
    .nullable()
    .optional(),
});

/**
 * `case_study_en` — Iteración 31 (i18n). Misma forma que `case_study`
 * pero TODOS los campos son opcionales: una Quest puede tener sólo
 * algunos capítulos traducidos (p.ej. "problem" en inglés pero
 * "uxProcess" todavía sin traducir) — el fallback es por capítulo, no
 * todo-o-nada (ver `mapSupabaseQuestRow` abajo). `chapter_media` nunca
 * se traduce (son imágenes, no texto), así que no se repite acá.
 */
const caseStudyEnRowSchema = z.object({
  problem: z.string().optional(),
  ux_process: z.string().optional(),
  ui_solution: z.string().optional(),
  impact: z.string().optional(),
});

/**
 * Forma cruda de una fila de `quests` tal como la devuelve
 * `supabase.from("quests").select("*")` — snake_case, JSONB para los
 * campos anidados. Es la única frontera donde el código "ve" el shape de
 * la base de datos; todo lo demás sigue usando `Quest` (camelCase).
 */
export const SupabaseQuestRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  role: z.string(),
  tech: z.array(z.string()),
  href: z.string().url().nullable(),
  status: z.enum(["completed", "in-progress"]),
  /** Iteración 16 ("CMS V2") — reemplaza al viejo `"draft"` de `status`. Ver `Quest.isPublished` (quest.ts) para el porqué. */
  is_published: z.boolean(),
  accent_color: z.string(),
  image_placeholder: z.object({ from: z.string(), to: z.string() }),
  media: questMediaRowSchema.nullable(),
  /** Iteración 39 — `010_hero_video.sql`. `.optional()`: filas leídas antes de correr la migración no traen la columna. */
  hero_video_url: z.string().nullable().optional(),
  testimonial: z.object({ quote: z.string(), author: z.string(), role: z.string() }).nullable(),
  case_study: caseStudyRowSchema,
  /**
   * Columnas de traducción — Iteración 31 (Deméter, "Expansión Global",
   * `009_i18n.sql`). Todas `nullable().optional()`: filas creadas antes
   * de esta migración, o simplemente todavía no traducidas, no las
   * tienen — `mapSupabaseQuestRow` cae al valor en español fila por fila
   * (y capítulo por capítulo en `case_study_en`).
   */
  title_en: z.string().nullable().optional(),
  summary_en: z.string().nullable().optional(),
  role_en: z.string().nullable().optional(),
  case_study_en: caseStudyEnRowSchema.nullable().optional(),
  sort_order: z.number().optional(),
  /** Iteración 23 — usado por `sitemap.ts` como `lastModified`. */
  updated_at: z.string().optional(),
});

export type SupabaseQuestRow = z.infer<typeof SupabaseQuestRowSchema>;

/** Idioma de lectura — Iteración 31. `"es"` es el idioma "fuente" de todo el contenido existente. */
export type Locale = "es" | "en";

/**
 * Adaptador fila-de-Supabase → `Quest`. Este es exactamente el código que
 * va dentro de `fetchQuestsFromSource()` en
 * `src/lib/demeter/queries/quests.ts` — `QuestSchema.parse` lo sigue
 * corriendo `getQuests()` después, así que queda doblemente verificado:
 * forma de la fila cruda, y forma final del dominio.
 *
 * `locale` (Iteración 31, default `"es"` — nunca rompe a un llamador
 * viejo que no lo pasa): con `"en"`, cada campo traducible usa su columna
 * `_en` SI existe y no es un string vacío; si no, cae al valor en
 * español. El fallback es campo por campo (y capítulo por capítulo
 * dentro de `caseStudy`) — una Quest con sólo el título traducido ya
 * muestra ESE campo en inglés sin esperar a que se traduzca todo lo demás.
 */
export function mapSupabaseQuestRow(row: SupabaseQuestRow, locale: Locale = "es"): Quest {
  const useEn = locale === "en";
  const pick = (base: string, translated: string | null | undefined) =>
    useEn && translated ? translated : base;

  const mapped = {
    id: row.id,
    title: pick(row.title, row.title_en),
    summary: pick(row.summary, row.summary_en),
    role: pick(row.role, row.role_en),
    tech: row.tech,
    href: row.href ?? undefined,
    status: row.status,
    isPublished: row.is_published,
    accentColor: row.accent_color,
    imagePlaceholder: row.image_placeholder,
    media: row.media ?? undefined,
    heroVideoUrl: row.hero_video_url ?? undefined,
    testimonial: row.testimonial ?? undefined,
    updatedAt: row.updated_at,
    caseStudy: {
      problem: pick(row.case_study.problem, row.case_study_en?.problem),
      uxProcess: pick(row.case_study.ux_process, row.case_study_en?.ux_process),
      uiSolution: pick(row.case_study.ui_solution, row.case_study_en?.ui_solution),
      impact: pick(row.case_study.impact, row.case_study_en?.impact),
      chapterMedia: row.case_study.chapter_media
        ? {
            problem: row.case_study.chapter_media.problem,
            uxProcess: row.case_study.chapter_media.ux_process,
            uiSolution: row.case_study.chapter_media.ui_solution,
            impact: row.case_study.chapter_media.impact,
          }
        : undefined,
    },
  };

  // Última verificación contra el schema de dominio (Deméter) — si el
  // mapeo de arriba quedó mal formado, falla acá con un mensaje de Zod
  // claro, no tres componentes de Hefesto más arriba.
  return QuestSchema.parse(mapped);
}
