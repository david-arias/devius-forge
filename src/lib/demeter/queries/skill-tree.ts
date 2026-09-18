import { unstable_cache } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase/client";
import { SkillNodeSchema, type SkillNode } from "../schemas";

/**
 * Repositorio de SkillTree (Deméter) — SOLO LECTURA. Ver el comentario
 * largo en `quests.ts` sobre por qué las mutaciones viven aparte, en
 * `skill-tree.mutations.ts` (nunca re-exportado desde `queries/index.ts`):
 * este archivo debe poder importarse desde código "use client" (vía el
 * barrel) sin arrastrar `next/headers`.
 *
 * Hasta la Iteración 30 la tabla `skill_tree` usaba los mismos nombres de
 * columna que `SkillNodeSchema` 1:1 y no hacía falta mapper. Desde la
 * Iteración 31 (i18n, `009_i18n.sql`) la fila trae también `label_en`/
 * `description_en`/`achievements_en`, que NO existen en `SkillNodeSchema`
 * — por eso ahora sí hay un mapper explícito (`mapRow` abajo) que resuelve
 * el idioma y descarta las columnas `_en` crudas antes de validar contra
 * el schema de dominio.
 */
/**
 * Iteración 19 (DEMÉTER — "Data Real"): el array de datos de prueba que
 * vivía acá se eliminó. Si Supabase está vacío o no responde, esta
 * lectura devuelve `[]` y la sección pública muestra su estado vacío
 * (`EmptyState`, Hefesto) en vez de contenido inventado.
 */

async function fetchSkillTreeFromSourceUncached(): Promise<unknown[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("skill_tree")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];
    return data;
  } catch (err) {
    console.warn(
      "[Deméter] No se pudo leer public.skill_tree de Supabase — devolviendo lista vacía (estado vacío en la UI).",
      err
    );
    return [];
  }
}

/** `unstable_cache` con tag `"skill-tree"` — invalidado por `save/delete/duplicateSkillNodeAction` (Iteración 16, mismo patrón que `quests.ts`). */
const getCachedSkillTreeRaw = unstable_cache(fetchSkillTreeFromSourceUncached, ["demeter-skill-tree-source"], {
  tags: ["skill-tree"],
});

/** Idioma de lectura — Iteración 31. Repetido acá (en vez de importarlo de `schema.ts`) para no acoplar este repositorio al de Quests. */
type Locale = "es" | "en";

function mapRow(row: Record<string, unknown>, locale: Locale): unknown {
  const useEn = locale === "en";
  const pick = (base: unknown, translated: unknown) =>
    useEn && typeof translated === "string" && translated.length > 0 ? translated : base;
  const pickArray = (base: unknown, translated: unknown) =>
    useEn && Array.isArray(translated) && translated.length > 0 ? translated : base;

  return {
    ...row,
    label: pick(row.label, row.label_en),
    description: pick(row.description, row.description_en),
    achievements: pickArray(row.achievements, row.achievements_en),
  };
}

export async function getSkillTree(options?: { locale?: Locale }): Promise<SkillNode[]> {
  const raw = await getCachedSkillTreeRaw();
  const rows = raw as Record<string, unknown>[];
  const locale = options?.locale ?? "es";
  return SkillNodeSchema.array().parse(rows.map((row) => mapRow(row, locale)));
}
