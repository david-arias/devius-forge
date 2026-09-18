import { unstable_cache } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase/client";
import { InventoryItemSchema, type InventoryItem } from "../schemas";

/**
 * Repositorio de Inventory (Deméter) — SOLO LECTURA. Ver el comentario
 * largo en `quests.ts` sobre por qué las mutaciones viven aparte
 * (`inventory.mutations.ts`, nunca re-exportado desde `queries/index.ts`)
 * y por qué `unstable_cache` es seguro acá (Iteración 16, "CMS V2" — el
 * barrel ya no tiene consumidores "use client" desde el fix post-Iteración 15).
 *
 * Desde la Iteración 16, la tabla `inventory` tiene una columna nueva
 * `is_published` (`004_publish_flags.sql`) — a diferencia de
 * `id`/`name`/`category`/`rarity`/`level` (que coinciden 1:1 con el
 * dominio y no necesitan mapper), esa columna SÍ necesita traducirse a
 * `isPublished` (camelCase) a mano: Supabase devuelve snake_case tal cual
 * viene de Postgres, y pasarle la fila cruda directo a
 * `InventoryItemSchema.parse()` dejaría `isPublished` sin encontrar su
 * valor y cayendo siempre al `.default(true)` del schema — silenciando
 * exactamente el flag que `duplicateInventoryItem` necesita poder apagar.
 */
/**
 * Iteración 19 (DEMÉTER — "Data Real"): el array de datos de prueba que
 * vivía acá se eliminó. Si Supabase está vacío o no responde, esta
 * lectura devuelve `[]` y la sección pública muestra su estado vacío
 * (`EmptyState`, Hefesto) en vez de contenido inventado.
 */

function mapInventoryRow(row: Record<string, unknown>): unknown {
  const { is_published, ...rest } = row;
  return { ...rest, isPublished: is_published ?? true };
}

async function fetchInventoryFromSourceUncached(): Promise<unknown[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];
    return data.map((row) => mapInventoryRow(row as Record<string, unknown>));
  } catch (err) {
    console.warn(
      "[Deméter] No se pudo leer public.inventory de Supabase — devolviendo lista vacía (estado vacío en la UI).",
      err
    );
    return [];
  }
}

/** `unstable_cache` con tag `"inventory"` — invalidado por `save/delete/duplicateInventoryItemAction` (Iteración 16, mismo patrón que `quests.ts`). */
const getCachedInventoryRaw = unstable_cache(fetchInventoryFromSourceUncached, ["demeter-inventory-source"], {
  tags: ["inventory"],
});

export async function getInventory(options?: { includeDrafts?: boolean }): Promise<InventoryItem[]> {
  const raw = await getCachedInventoryRaw();
  const items = InventoryItemSchema.array().parse(raw);
  if (options?.includeDrafts) return items;
  return items.filter((item) => item.isPublished);
}
