"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState, useTransition } from "react";
import { DragHandle, SearchInput, SortableItem } from "@/components/hefesto/ui";
import { updateInventoryOrderAction } from "@/lib/minerva/actions/inventory-actions";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { type InventoryItem } from "@/lib/demeter/schemas";
import { InventoryForm } from "./InventoryForm";

interface InventoryManagerProps {
  /** Ítems ya ordenados por `sort_order` — viene de `getInventory({ includeDrafts: true })` (Deméter). */
  items: InventoryItem[];
}

/**
 * InventoryManager — Iteración 17 ("Escalabilidad del CMS"). Mismo
 * patrón que `QuestsManager.tsx` (ver ahí el porqué de cada decisión:
 * `@dnd-kit`, drag desactivado durante la búsqueda, reordenamiento
 * optimista) aplicado al Inventario — filtra por `name` en vez de
 * `title`.
 */
export function InventoryManager({ items: initialItems }: InventoryManagerProps) {
  const [items, setItems] = useState(initialItems);
  // Iteración 40 — mismo fix que `QuestsManager`: resincroniza con la prop
  // cuando el servidor revalida tras borrar/duplicar (sin esto el ítem
  // borrado seguía en pantalla hasta recargar).
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  if (initialItems !== prevInitialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
  }
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const pushToast = useAdminToastStore((state) => state.push);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;
  const filteredItems = useMemo(
    () => (isSearching ? items.filter((item) => item.name.toLowerCase().includes(trimmedQuery)) : items),
    [items, trimmedQuery, isSearching]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const order = reordered.map((item, index) => ({ id: item.id, order: index }));
    startTransition(() => {
      void updateInventoryOrderAction(order).then((result) => {
        if (result.status !== "idle" && result.message) pushToast(result.status, result.message);
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar ítem por nombre…"
        aria-label="Buscar ítem del inventario por nombre"
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={filteredItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {filteredItems.map((item) => (
              <SortableItem key={item.id} id={item.id} disabled={isSearching}>
                {({ attributes, listeners }) => (
                  <InventoryForm
                    initialValues={item}
                    collapsible
                    dragHandle={
                      <DragHandle
                        attributes={attributes}
                        listeners={listeners}
                        label={`ítem "${item.name}"`}
                        disabled={isSearching}
                      />
                    }
                  />
                )}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredItems.length === 0 && (
        <p className="rounded-md border border-dashed border-white/10 px-4 py-6 text-center text-sm text-parchment-muted">
          Ningún ítem coincide con &quot;{query}&quot;.
        </p>
      )}
    </div>
  );
}
