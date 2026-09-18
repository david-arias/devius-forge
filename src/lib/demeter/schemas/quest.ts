import { z } from "zod";

/**
 * Forma compartida de una imagen/video real (evidencia visual). Usada tanto
 * por `media` (imagen protagonista de la Quest, Iteración 9) como por
 * `caseStudy.chapterMedia` (imagen por capítulo del caso de estudio,
 * Iteración 12) — ver `QuestSchema` abajo. Factorizada acá para no repetir
 * la misma forma dos veces y para que el mapper de Supabase
 * (`src/lib/supabase/schema.ts`) tenga un solo tipo que validar.
 */
export const QuestMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  /** Ruta pública o URL de Supabase Storage (bucket `quest-images`, ver `src/lib/supabase/schema.ts`). */
  src: z.string(),
  alt: z.string(),
  /** Poster opcional para video (evita el frame negro mientras carga). */
  poster: z.string().optional(),
});

export type QuestMedia = z.infer<typeof QuestMediaSchema>;

/** Quest = Proyecto del portafolio. Dominio Deméter. */
export const QuestSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  role: z.string(),
  tech: z.array(z.string()),
  href: z.string().url().optional(),
  status: z.enum(["completed", "in-progress"]).default("completed"),
  /**
   * Visibilidad pública — Iteración 16 ("CMS V2"), unifica el mismo
   * concepto que `SkillNode.unlocked` (Skill Tree) y
   * `InventoryItem.isPublished` (Inventario): `false` = borrador, oculto
   * de `/quests` y `/quests/[slug]` aunque exista en la base. Reemplaza
   * al valor `"draft"` que `status` tenía en la Iteración 15 — separar
   * "en qué fase está el proyecto" (`status`) de "se puede ver
   * públicamente" (`isPublished`) evita mezclar dos preguntas distintas
   * en un solo campo. `.default(true)` para que una fila de Supabase sin
   * la columna todavía (antes de correr `004_publish_flags.sql`), o el
   * array `STATIC_QUESTS` de fallback, sigan pareciendo publicadas.
   */
  isPublished: z.boolean().default(true),
  /** Última modificación en Supabase (ISO) — Iteración 23, para el sitemap. */
  updatedAt: z.string().optional(),
  /** Color de acento hex único del proyecto (glow de hover, borde, eyebrow). */
  accentColor: z.string(),
  /**
   * Placeholder visual del mockup mientras no hay screenshot real —
   * gradiente de 2 stops que Hefesto pinta en la cabecera de la carta.
   * Se sigue usando como fallback cuando `media` no está definido.
   */
  imagePlaceholder: z.object({
    from: z.string(),
    to: z.string(),
  }),
  /**
   * Evidencia visual real del proyecto (MINERVA, auditoría 2026-09-15,
   * hallazgo de Alto Impacto: "los Quests no muestran el trabajo real").
   * Opcional a propósito — mientras no haya asset real, `QuestShowcase`
   * sigue usando `imagePlaceholder`. Subir el archivo a `/public/quests/`
   * y completar este campo por Quest apenas haya una captura o loop real
   * (ver Fase 2 de la bitácora de auditoría).
   */
  media: QuestMediaSchema.optional(),
  /**
   * Prueba social (MINERVA, auditoría 2026-09-15, hallazgo Bajo Impacto).
   * Cita corta + nombre + rol de quien lo dice. Opcional — sólo se
   * renderiza si está presente, nunca se inventa un testimonio placeholder.
   */
  testimonial: z
    .object({
      quote: z.string(),
      author: z.string(),
      role: z.string(),
    })
    .optional(),
  /**
   * Caso de estudio completo — Iteración 8 (Minerva). Contenido de la
   * página de detalle `/quests/[slug]`, en 4 "capítulos" fijos que
   * cuentan la historia completa del proyecto de punta a punta.
   */
  caseStudy: z.object({
    problem: z.string(),
    uxProcess: z.string(),
    uiSolution: z.string(),
    impact: z.string(),
    /**
     * Imagen/mockup real por capítulo — Iteración 12 (Hefesto, "Revolución
     * de la página de Quest"). Cada clave es opcional a propósito: mientras
     * no exista el asset real de un capítulo puntual, `QuestPage` cae al
     * placeholder de gradiente + ícono `Image` de lucide-react para ESE
     * capítulo únicamente (no bloquea a los demás). Subir a Supabase
     * Storage (bucket `quest-images`, ver `src/lib/supabase/schema.ts`)
     * cuando existan.
     */
    chapterMedia: z
      .object({
        problem: QuestMediaSchema.optional(),
        uxProcess: QuestMediaSchema.optional(),
        uiSolution: QuestMediaSchema.optional(),
        impact: QuestMediaSchema.optional(),
      })
      .optional(),
  }),
});

export type Quest = z.infer<typeof QuestSchema>;
