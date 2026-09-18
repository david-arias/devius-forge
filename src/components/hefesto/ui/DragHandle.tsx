"use client";

import { GripVertical } from "lucide-react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";

interface DragHandleProps {
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  label: string;
  disabled?: boolean;
}

/**
 * DragHandle — Hefesto/Minerva, Iteración 17 ("Escalabilidad del CMS").
 * Ícono de "agarrar y arrastrar" (`GripVertical`) reutilizado por las
 * filas de Quests, Inventario y Skill Tree. `attributes`/`listeners`
 * vienen de `useSortable()` (`@dnd-kit/sortable`) — este componente no
 * sabe nada de DnD, sólo expone el botón accesible (foco visible,
 * `aria-label` descriptivo, `touch-action: none` para que arrastrar en
 * mobile no scrollee la página) donde @dnd-kit engancha sus listeners de
 * puntero/teclado. Sin `attributes`/`listeners` (ej. mientras la lista
 * todavía no montó el `DndContext`) queda como un ícono inerte, nunca
 * rompe el layout.
 */
export function DragHandle({ attributes, listeners, label, disabled = false }: DragHandleProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Reordenar ${label} (arrastrar, o usar flechas con foco)`}
      className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-md text-parchment-muted/70 transition-colors duration-150 hover:bg-carbon-elevated hover:text-parchment focus-visible:text-parchment active:cursor-grabbing disabled:pointer-events-none disabled:opacity-40"
      style={{ touchAction: "none" }}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" aria-hidden />
    </button>
  );
}
