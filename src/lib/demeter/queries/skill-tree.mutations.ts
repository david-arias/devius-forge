import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SkillNodeSchema, type SkillNode } from "../schemas";

/**
 * Mutaciones del Skill Tree (Deméter, Iteración 15) — separado de
 * `skill-tree.ts` y nunca re-exportado desde `queries/index.ts`. Ver el
 * comentario largo en `quests.mutations.ts` para el porqué.
 */

function toRow(input: SkillNode) {
  return {
    id: input.id,
    label: input.label,
    period: input.period ?? null,
    description: input.description,
    achievements: input.achievements ?? [],
    unlocked: input.unlocked,
  };
}

export async function upsertSkillNode(input: SkillNode): Promise<void> {
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
  const rows = order.map(({ id, order: sortOrder }) => ({ id, sort_order: sortOrder }));

  const { error } = await supabase.from("skill_tree").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`No se pudo actualizar el orden del skill tree: ${error.message}`);
}
