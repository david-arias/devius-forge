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
import { useState, useTransition } from "react";
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
 * SkillTreeManager — Iteración 17 ("Escalabilidad del CMS"). A
 * diferencia de `QuestsManager`/`InventoryManager`, el pedido de Hefesto
 * (Layout de Acordeón + buscador) sólo nombra explícitamente "Quests e
 * Inventario" — el Skill Tree se queda con su `SkillsForm` siempre
 * expandido, sólo gana la capacidad de reordenar por Drag & Drop
 * (pedida por Minerva para las 3 secciones por igual). Mismo motor
 * `@dnd-kit` y misma lógica de reordenamiento optimista que
 * `QuestsManager.tsx` — ver ahí el detalle.
 */
export function SkillTreeManager({ nodes: initialNodes, enDrafts }: SkillTreeManagerProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [, startTransition] = useTransition();
  const pushToast = useAdminToastStore((state) => state.push);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = nodes.findIndex((node) => node.id === active.id);
    const newIndex = nodes.findIndex((node) => node.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(nodes, oldIndex, newIndex);
    setNodes(reordered);

    const order = reordered.map((node, index) => ({ id: node.id, order: index }));
    startTransition(() => {
      void updateSkillTreeOrderAction(order).then((result) => {
        if (result.status !== "idle" && result.message) pushToast(result.status, result.message);
      });
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={nodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-8">
          {nodes.map((node) => (
            <SortableItem key={node.id} id={node.id}>
              {({ attributes, listeners }) => (
                <SkillsForm
                  initialValues={node}
                  initialValuesEn={enDrafts[node.id]}
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
