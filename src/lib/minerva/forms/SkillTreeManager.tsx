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
import { useEffect, useRef, useState, useTransition } from "react";
import { DragHandle, SortableItem } from "@/components/hefesto/ui";
import { updateSkillTreeOrderAction } from "@/lib/minerva/actions/skill-actions";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { type SkillNode } from "@/lib/demeter/schemas";
import { type SkillNodeEnDraft } from "@/lib/demeter/queries/skill-tree";
import { SkillsForm } from "./SkillsForm";

interface SkillTreeManagerProps {
  /** Nodos ya ordenados por `sort_order` — viene de `getSkillTree()` (Deméter). */
  nodes: SkillNode[];
  /** Iteración 32 (i18n) — borrador EN por id de nodo, viene de `getSkillTreeEnDrafts()` (Deméter). */
  enDrafts: Record<string, SkillNodeEnDraft>;
}

/**
 * SkillTreeManager — Iteración 17 ("Escalabilidad del CMS"), extendido
 * en la Iteración 42 (Hefesto & Minerva, "Acordeón en Skill Tree"):
 *
 *  1. **Acordeón** — cada nodo existente se pinta con `SkillsForm
 *     collapsible`: colapsado por defecto, sólo el título en la cabecera;
 *     al expandir aparece el formulario de edición (mismo patrón que
 *     `QuestsManager`/`QuestForm`).
 *  2. **Drag & Drop** — sin cambios (`@dnd-kit`, reordenamiento optimista).
 *  3. **Flechas Arriba/Abajo** (bonus) — mueven el nodo UNA posición y
 *     persisten el nuevo `sort_order` con el MISMO Server Action que el
 *     Drag & Drop (`updateSkillTreeOrderAction`). Más precisas que
 *     arrastrar en una lista larga y 100% accesibles por teclado.
 */
export function SkillTreeManager({ nodes: initialNodes, enDrafts }: SkillTreeManagerProps) {
  const [nodes, setNodes] = useState(initialNodes);
  // Iteración 40 — mismo fix que `QuestsManager`: resincroniza con la prop
  // cuando el servidor revalida tras borrar/duplicar (sin esto el ítem
  // borrado seguía en pantalla hasta recargar).
  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);
  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    setNodes(initialNodes);
  }
  const [, startTransition] = useTransition();
  const pushToast = useAdminToastStore((state) => state.push);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Tras mover con flecha, React reubica el nodo en el DOM y el botón
  // pierde el foco — se lo devolvemos para poder pulsar varias veces
  // seguidas sin volver a tabular (y si llegó al extremo, al botón opuesto).
  const pendingFocus = useRef<{ id: string; direction: "up" | "down" } | null>(null);
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const preferred = document.querySelector<HTMLButtonElement>(`[data-move="${target.id}-${target.direction}"]`);
    const fallback = document.querySelector<HTMLButtonElement>(
      `[data-move="${target.id}-${target.direction === "up" ? "down" : "up"}"]`
    );
    (preferred && !preferred.disabled ? preferred : fallback)?.focus();
  }, [nodes]);

  function persistOrder(reordered: SkillNode[]) {
    setNodes(reordered);
    const order = reordered.map((node, index) => ({ id: node.id, order: index }));
    startTransition(() => {
      void updateSkillTreeOrderAction(order).then((result) => {
        if (result.status !== "idle" && result.message) pushToast(result.status, result.message);
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = nodes.findIndex((node) => node.id === active.id);
    const newIndex = nodes.findIndex((node) => node.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    persistOrder(arrayMove(nodes, oldIndex, newIndex));
  }

  function moveNode(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= nodes.length) return;
    pendingFocus.current = { id: nodes[index].id, direction };
    persistOrder(arrayMove(nodes, index, target));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={nodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {nodes.map((node, index) => (
            <SortableItem key={node.id} id={node.id}>
              {({ attributes, listeners }) => (
                <SkillsForm
                  initialValues={node}
                  initialValuesEn={enDrafts[node.id]}
                  collapsible
                  position={{ index: index + 1, total: nodes.length }}
                  onMoveUp={index > 0 ? () => moveNode(index, "up") : undefined}
                  onMoveDown={index < nodes.length - 1 ? () => moveNode(index, "down") : undefined}
                  dragHandle={<DragHandle attributes={attributes} listeners={listeners} label={`nodo "${node.label}"`} />}
                />
              )}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
