import { getInventory } from "@/lib/demeter/queries/inventory";
import { InventoryForm } from "@/lib/minerva/forms/InventoryForm";
import { InventoryManager } from "@/lib/minerva/forms/InventoryManager";

/**
 * `/admin/inventory` — Minerva, Iteración 14, rediseñado en la 17
 * ("Escalabilidad del CMS") como lista de acordeón con buscador y
 * reordenamiento Drag & Drop (`InventoryManager`) — mismo tratamiento
 * que `/admin/quests`. El ítem "Nuevo" queda fuera del manager, siempre
 * visible y expandido al final.
 */
export default async function AdminInventoryPage() {
  const inventory = await getInventory({ includeDrafts: true });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="font-display text-2xl text-parchment">Inventario</h1>

      <InventoryManager items={inventory} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-parchment-muted">
          Nuevo ítem
        </h2>
        <InventoryForm />
      </div>
    </div>
  );
}
