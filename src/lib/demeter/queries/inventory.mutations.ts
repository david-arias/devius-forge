import { createServerSupabaseClient } from "@/lib/supabase/server";
import { InventoryItemSchema, type InventoryItem } from "../schemas";

/**
 * Mutaciones del Inventario (Deméter, Iteración 15, extendido en la 16
 * "CMS V2" con `is_published`) — separado de `inventory.ts` y nunca
 * re-exportado desde `queries/index.ts`. Ver el comentario largo en
 * `quests.mutations.ts` para el porqué del archivo aparte.
 */

function toRow(input: InventoryItem) {
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    rarity: input.rarity,
    level: input.level,
    is_published: input.isPublished,
  };
}

function mapRow(row: Record<string, unknown>): InventoryItem {
  const { is_published, ...rest } = row;
  return InventoryItemSchema.parse({ ...rest, isPublished: is_published ?? true });
}

export async function upsertInventoryItem(input: InventoryItem): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("inventory").upsert(toRow(input), { onConflict: "id" });
  if (error) throw new Error(`No se pudo guardar el ítem: ${error.message}`);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw new Error(`No se pudo eliminar el ítem: ${error.message}`);
}

/**
 * Duplica un ítem. Desde la Iteración 16, la copia queda con
 * `isPublished: false` — mismo patrón que `duplicateQuest`/
 * `duplicateSkillNode` — en vez de sólo confiar en el sufijo "(copia)"
 * del nombre como señal visual.
 */
export async function duplicateInventoryItem(id: string): Promise<InventoryItem> {
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("inventory")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    throw new Error("No se encontró el ítem a duplicar.");
  }

  const parsed = mapRow(existing as Record<string, unknown>);
  const newId = `${parsed.id}-copia-${Date.now().toString(36)}`;
  const newName = `${parsed.name} (copia)`;

  const rest: Record<string, unknown> = { ...(existing as Record<string, unknown>) };
  delete rest.created_at;
  delete rest.updated_at;
  const insertRow = { ...rest, id: newId, name: newName, is_published: false };

  const { error: insertError } = await supabase.from("inventory").insert(insertRow);
  if (insertError) throw new Error(`No se pudo duplicar el ítem: ${insertError.message}`);

  return { ...parsed, id: newId, name: newName, isPublished: false };
}

/**
 * Reordenamiento por Drag & Drop (Iteración 17) — mismo patrón que
 * `bulkUpdateQuestOrder` en `quests.mutations.ts`: un `update` por fila
 * que sólo toca `sort_order`, sin tocar el resto de columnas del ítem.
 */
export async function bulkUpdateInventoryOrder(order: { id: string; order: number }[]): Promise<void> {
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
      supabase.from("inventory").update({ sort_order: sortOrder }).eq("id", id)
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`No se pudo actualizar el orden del inventario: ${failed.error.message}`);
}
