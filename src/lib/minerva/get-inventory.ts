import { draftMode } from "next/headers";
import { getInventory as fetchInventory } from "@/lib/demeter/queries/inventory";

/**
 * Servicio de Minerva: expone el Inventario ya listo para Hefesto. No es un React Hook.
 *
 * Iteración 18 (APOLO — "El Puente Bifröst"): mismo patrón que
 * `get-quests.ts` — con Draft Mode activo se piden también los ítems en
 * borrador (`isPublished === false`) para que el preview del CMS los
 * muestre; sin Draft Mode, comportamiento sin cambios (sólo publicados).
 */
export async function getInventoryForView() {
  const { isEnabled } = await draftMode();
  return fetchInventory(isEnabled ? { includeDrafts: true } : undefined);
}
