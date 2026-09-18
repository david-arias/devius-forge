"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import type { CSSProperties, ReactNode } from "react";

interface SortableItemRenderArgs {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  isDragging: boolean;
}

interface SortableItemProps {
  id: string;
  /** Desactiva temporalmente el drag (ej. mientras hay un filtro de búsqueda activo, ver `QuestsManager.tsx`/`InventoryManager.tsx`). */
  disabled?: boolean;
  children: (args: SortableItemRenderArgs) => ReactNode;
}

/**
 * SortableItem — Hefesto/Minerva, Iteración 17 ("Escalabilidad del CMS").
 * Envoltorio genérico de `useSortable()` (`@dnd-kit/sortable`) con
 * render-prop: no conoce Quests/Inventario/Skill Tree, sólo posiciona el
 * elemento dentro de la lista arrastrable (`transform`/`transition` de
 * dnd-kit) y le pasa `attributes`/`listeners` a quien lo use — normalmente
 * un `DragHandle` dentro de `QuestForm`/`InventoryForm`/`SkillsForm`, para
 * que sólo el ícono de agarre sea el "target" de arrastre y no toda la
 * tarjeta (así los inputs del formulario expandido siguen siendo
 * clickeables/seleccionables sin iniciar un drag por accidente).
 */
export function SortableItem({ id, disabled = false, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners, isDragging })}
    </div>
  );
}
