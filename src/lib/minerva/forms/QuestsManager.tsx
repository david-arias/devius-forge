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
import { updateQuestsOrderAction } from "@/lib/minerva/actions/quest-actions";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { type Quest } from "@/lib/demeter/schemas";
import { QuestForm } from "./QuestForm";

interface QuestsManagerProps {
  /** Quests ya ordenadas por `sort_order` — viene de `getQuests({ includeDrafts: true })` (Deméter). */
  quests: Quest[];
}

/**
 * QuestsManager — Minerva/Hefesto/Deméter, Iteración 17 ("Escalabilidad
 * del CMS"). Orquesta las 3 piezas de la Fase 3 de la auditoría para
 * `/admin/quests`:
 *
 *  1. **Buscador** (Hefesto — filtra localmente por título, sin golpear
 *     Supabase de nuevo).
 *  2. **Drag & Drop** (Minerva — `@dnd-kit`, elegido por sobre
 *     `@hello-pangea/dnd` por su API modular sin dependencia de Redux ni
 *     de la Context API legada, y soporte de teclado de fábrica vía
 *     `KeyboardSensor` — accesibilidad, no sólo mouse).
 *  3. **Acordeón** — delegado a `QuestForm` (`collapsible`), este
 *     componente sólo decide QUÉ orden mostrar, no cómo se ve cada fila.
 *
 * El reordenamiento es optimista: `setQuests` actualiza la UI al soltar,
 * y recién después se llama a `updateQuestsOrderAction` (Deméter) en una
 * transición — si falla, el toast de error avisa pero la UI no hace
 * rollback automático (recargar la página vuelve a traer el orden real
 * de la base, que es la fuente de verdad).
 *
 * Mientras hay una búsqueda activa el drag se desactiva (`disabled` en
 * `SortableItem`/`DragHandle`): reordenar un subconjunto filtrado no
 * tiene una posición "correcta" no ambigua dentro de la lista completa.
 */
export function QuestsManager({ quests: initialQuests }: QuestsManagerProps) {
  const [quests, setQuests] = useState(initialQuests);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const pushToast = useAdminToastStore((state) => state.push);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;
  const filteredQuests = useMemo(
    () => (isSearching ? quests.filter((quest) => quest.title.toLowerCase().includes(trimmedQuery)) : quests),
    [quests, trimmedQuery, isSearching]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = quests.findIndex((quest) => quest.id === active.id);
    const newIndex = quests.findIndex((quest) => quest.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(quests, oldIndex, newIndex);
    setQuests(reordered);

    const order = reordered.map((quest, index) => ({ id: quest.id, order: index }));
    startTransition(() => {
      void updateQuestsOrderAction(order).then((result) => {
        if (result.status !== "idle" && result.message) pushToast(result.status, result.message);
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar quest por título…"
        aria-label="Buscar quest por título"
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={filteredQuests.map((quest) => quest.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {filteredQuests.map((quest) => (
              <SortableItem key={quest.id} id={quest.id} disabled={isSearching}>
                {({ attributes, listeners }) => (
                  <QuestForm
                    initialValues={quest}
                    collapsible
                    dragHandle={
                      <DragHandle
                        attributes={attributes}
                        listeners={listeners}
                        label={`Quest "${quest.title}"`}
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

      {filteredQuests.length === 0 && (
        <p className="rounded-md border border-dashed border-white/10 px-4 py-6 text-center text-sm text-parchment-muted">
          Ninguna quest coincide con &quot;{query}&quot;.
        </p>
      )}
    </div>
  );
}
