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
  testimonial: z.object({ quote: z.string(), author: z.string(), role: z.string() }).nullable(),
  case_study: z.object({
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
  }),
  sort_order: z.number().optional(),
  /** Iteración 23 — usado por `sitemap.ts` como `lastModified`. */
  updated_at: z.string().optional(),
});

export type SupabaseQuestRow = z.infer<typeof SupabaseQuestRowSchema>;

/**
 * Adaptador fila-de-Supabase → `Quest`. Este es exactamente el código que
 * va dentro de `fetchQuestsFromSource()` en
 * `src/lib/demeter/queries/quests.ts` el día que se reemplace el array
 * estático — se deja hecho y ya validado con Zod (`QuestSchema.parse` lo
 * sigue corriendo `getQuests()` después, así que queda doblemente
 * verificado: forma de la fila cruda, y forma final del dominio).
 *
 * Uso previsto (no activo todavía — el array estático sigue siendo la
 * fuente real hasta que exista un proyecto de Supabase conectado):
 * ```ts
 * async function fetchQuestsFromSource(): Promise<unknown[]> {
 *   const { data, error } = await getSupabaseClient()
 *     .from("quests")
 *     .select("*")
 *     .order("sort_order", { ascending: true });
 *   if (error) throw error;
 *   return data.map((row) => mapSupabaseQuestRow(SupabaseQuestRowSchema.parse(row)));
 * }
 * ```
 */
export function mapSupabaseQuestRow(row: SupabaseQuestRow): Quest {
  const mapped = {
    id: row.id,
    title: row.title,
    summary: row.summary,
    role: row.role,
    tech: row.tech,
    href: row.href ?? undefined,
    status: row.status,
    isPublished: row.is_published,
    accentColor: row.accent_color,
    imagePlaceholder: row.image_placeholder,
    media: row.media ?? undefined,
    testimonial: row.testimonial ?? undefined,
    updatedAt: row.updated_at,
    caseStudy: {
      problem: row.case_study.problem,
      uxProcess: row.case_study.ux_process,
      uiSolution: row.case_study.ui_solution,
      impact: row.case_study.impact,
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
