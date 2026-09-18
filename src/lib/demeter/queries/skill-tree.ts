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
 * La tabla `skill_tree` (`002_admin_tables.sql`) ya usa los mismos
 * nombres de columna que `SkillNodeSchema`, así que no hace falta un
 * mapper: `SkillNodeSchema.array().parse(data)` descarta las columnas
 * extra (`sort_order`, `created_at`, `updated_at`) porque Zod ignora
 * claves no declaradas por defecto.
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

export async function getSkillTree(): Promise<SkillNode[]> {
  const raw = await getCachedSkillTreeRaw();
  return SkillNodeSchema.array().parse(raw);
}
