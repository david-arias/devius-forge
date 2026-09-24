import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SkillNodeSchema, type SkillNode } from "../schemas";

/**
 * Mutaciones del Skill Tree (Deméter, Iteración 15) — separado de
 * `skill-tree.ts` y nunca re-exportado desde `queries/index.ts`. Ver el
 * comentario largo en `quests.mutations.ts` para el porqué.
 */

/** `SkillNode` (dominio de LECTURA) + las traducciones EN que `SkillsForm` edita — ver `toSkillNodeInput()` en `skills-form-schema.ts`. */
export type SkillNodeUpsertInput = SkillNode & {
  labelEn?: string;
  descriptionEn?: string;
  achievementsEn?: string[];
};

/** `""`/`[]` (valor por defecto de un formulario sin completar) → `null` — mismo criterio que `emptyToNull` en `quests.mutations.ts`. */
function emptyToNull(value: string | undefined): string | null {
  return value && value.trim().length > 0 ? value : null;
}

function arrayEmptyToNull(value: string[] | undefined): string[] | null {
  return value && value.length > 0 ? value : null;
}

function toRow(input: SkillNodeUpsertInput) {
  return {
    id: input.id,
    label: input.label,
    period: input.period ?? null,
    description: input.description,
    achievements: input.achievements ?? [],
    unlocked: input.unlocked,
    // Iteración 32 (i18n) — columnas hermanas en inglés, ver `009_i18n.sql`.
    label_en: emptyToNull(input.labelEn),
    description_en: emptyToNull(input.descriptionEn),
    achievements_en: arrayEmptyToNull(input.achievementsEn),
  };
}

export async function upsertSkillNode(input: SkillNodeUpsertInput): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("skill_tree").upsert(toRow(input), { onConflict: "id" });
  if (error) throw new Error(`No se pudo guardar el nodo: ${error.message}`);
}

export async function deleteSkillNode(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("skill_tree").delete().eq("id", id);
  if (error) throw new Error(`No se pudo eliminar el nodo: ${error.message}`);
}

/**
 * Duplica un nodo. `SkillNode` no tiene un campo `status` como `Quest` —
 * `unlocked: false` cumple el mismo rol: la copia queda oculta del Skill
 * Tree público hasta que se revise y se marque "Desbloqueado" a mano.
 */
export async function duplicateSkillNode(id: string): Promise<SkillNode> {
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("skill_tree")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    throw new Error("No se encontró el nodo a duplicar.");
  }

  const parsed = SkillNodeSchema.parse(existing);
  const newId = `${parsed.id}-copia-${Date.now().toString(36)}`;
  const newLabel = `${parsed.label} (copia)`;

  const rest: Record<string, unknown> = { ...(existing as Record<string, unknown>) };
  delete rest.created_at;
  delete rest.updated_at;
  const insertRow = { ...rest, id: newId, label: newLabel, unlocked: false };

  const { error: insertError } = await supabase.from("skill_tree").insert(insertRow);
  if (insertError) throw new Error(`No se pudo duplicar el nodo: ${insertError.message}`);

  return { ...parsed, id: newId, label: newLabel, unlocked: false };
}

/**
 * Reordenamiento por Drag & Drop (Iteración 17) — mismo patrón que
 * `bulkUpdateQuestOrder`/`bulkUpdateInventoryOrder`.
 */
export async function bulkUpdateSkillTreeOrder(order: { id: string; order: number }[]): Promise<void> {
  if (order.length === 0) return;

  const supabase = await createServerSupabaseClient();
  // Iteración 42 (fix "null value in column … violates not-null
  // constraint"): antes era un `upsert` con sólo `{ id, sort_order }`.
  // Postgres arma primero la fila de INSERT y valida los NOT NULL
  // (`label`, `title`, …) ANTES de detectar el conflicto por `id`, así que
  // el reordenamiento fallaba aunque la fila ya existiera. Un `update`
  // por fila sólo toca `sort_order` y nunca intenta insertar.
  const results = await Promise.all(
    order.map(({ id, order: sortOrder }) =>
      supabase.from("skill_tree").update({ sort_order: sortOrder }).eq("id", id)
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`No se pudo actualizar el orden del skill tree: ${failed.error.message}`);
}
