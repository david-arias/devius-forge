"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type BaseSyntheticEvent, type ReactNode, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Card, ConfirmDialog, EntityActionsMenu, PreviewLink } from "@/components/hefesto/ui";
import { initialActionState } from "@/lib/minerva/actions/action-state";
import {
  deleteSkillNodeAction,
  duplicateSkillNodeAction,
  saveSkillNodeAction,
} from "@/lib/minerva/actions/skill-actions";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { type SkillNode } from "@/lib/demeter/schemas";
import { SkillsFormSchema, type SkillsFormValues } from "./skills-form-schema";

interface SkillsFormProps {
  /** Valores iniciales de UN nodo — hoy viene de `getSkillTree()` (Deméter). */
  initialValues?: SkillNode;
  /**
   * Ícono de "agarrar y arrastrar" (Iteración 17, "Escalabilidad del
   * CMS") — ya cableado a `useSortable()` por `SkillTreeManager.tsx`.
   * A diferencia de Quests/Inventario, el Skill Tree NO gana vista de
   * acordeón en esta iteración (fuera del alcance pedido para Hefesto —
   * sólo Quests e Inventario), sólo reordenamiento.
   */
  dragHandle?: ReactNode;
}

/**
 * SkillsForm — Minerva, Iteración 15 ("Refinamiento de la Forja Oculta").
 * Mismo tratamiento que `QuestForm.tsx`: persiste de verdad
 * (`saveSkillNodeAction`), `method="post"` + Server Action como `action`
 * del `<form>` (fallback nativo seguro sin JS), `EntityActionsMenu` con
 * Duplicar/Eliminar (Eliminar detrás de `ConfirmDialog`), y Toasts de
 * éxito/error. No tiene campos de color — no aplica `ColorSwatchInput`.
 */
export function SkillsForm({ initialValues, dragHandle }: SkillsFormProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const pushToast = useAdminToastStore((state) => state.push);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SkillsFormValues>({
    resolver: zodResolver(SkillsFormSchema),
    defaultValues: {
      id: initialValues?.id ?? "",
      label: initialValues?.label ?? "",
      period: initialValues?.period ?? "",
      description: initialValues?.description ?? "",
      achievements: initialValues?.achievements?.join("\n") ?? "",
      unlocked: initialValues?.unlocked ?? true,
    },
  });

  const [saveState, saveFormAction, savePending] = useActionState(saveSkillNodeAction, initialActionState);
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteSkillNodeAction,
    initialActionState
  );
  const [duplicateState, duplicateFormAction, duplicatePending] = useActionState(
    duplicateSkillNodeAction,
    initialActionState
  );

  useEffect(() => {
    if (saveState.status === "idle" || !saveState.message) return;
    pushToast(saveState.status, saveState.message);
  }, [saveState, pushToast]);

  useEffect(() => {
    if (deleteState.status === "idle" || !deleteState.message) return;
    pushToast(deleteState.status, deleteState.message);
  }, [deleteState, pushToast]);

  useEffect(() => {
    if (duplicateState.status === "idle" || !duplicateState.message) return;
    pushToast(duplicateState.status, duplicateState.message);
  }, [duplicateState, pushToast]);

  function onValidSubmit(_values: SkillsFormValues, event?: BaseSyntheticEvent) {
    const formEl = event?.target as HTMLFormElement | undefined;
    if (!formEl) return;
    saveFormAction(new FormData(formEl));
  }

  function handleDuplicate() {
    if (!initialValues) return;
    const fd = new FormData();
    fd.set("id", initialValues.id);
    duplicateFormAction(fd);
  }

  function handleConfirmDelete() {
    if (!initialValues) return;
    // Cierre optimista: el toast (éxito o error) es el feedback real de
    // cómo salió — mantener el modal abierto hasta que el Server Action
    // resuelva forzaría a `setConfirmDeleteOpen` a vivir en un efecto que
    // reacciona a `deleteState`, lo cual el linter de React Compiler marca
    // como error ("setState síncrono dentro de un efecto").
    setConfirmDeleteOpen(false);
    const fd = new FormData();
    fd.set("id", initialValues.id);
    deleteFormAction(fd);
  }

  const isPending = savePending || deletePending || duplicatePending;

  return (
    <Card className="max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {dragHandle}
          <h2 className="font-display text-xl text-parchment">Skill Tree — nodo</h2>
        </div>
        {initialValues && (
          <div className="flex shrink-0 items-center gap-2">
            {/* El Skill Tree no tiene página propia — previsualiza la
                sección "#skill-tree" de la home (Hefesto, Iteración 18). */}
            <PreviewLink slug="/#skill-tree" />
            <EntityActionsMenu
              entityLabel={`nodo "${initialValues.label}"`}
              onDuplicate={handleDuplicate}
              onDelete={() => setConfirmDeleteOpen(true)}
              disabled={isPending}
            />
          </div>
        )}
      </div>

      <form
        action={saveFormAction}
        method="post"
        onSubmit={handleSubmit(onValidSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="id" className="text-sm font-medium text-parchment">
            Id (slug único)
          </label>
          <input
            id="id"
            {...register("id")}
            className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
          />
          {errors.id && (
            <p role="alert" className="text-xs text-danger">
              {errors.id.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="label" className="text-sm font-medium text-parchment">
            Label (título del puesto)
          </label>
          <input
            id="label"
            {...register("label")}
            className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
          />
          {errors.label && (
            <p role="alert" className="text-xs text-danger">
              {errors.label.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="period" className="text-sm font-medium text-parchment">
            Período (opcional, p.ej. &quot;2023 — presente&quot;)
          </label>
          <input
            id="period"
            {...register("period")}
            className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-parchment">
            Descripción
          </label>
          <textarea
            id="description"
            rows={3}
            {...register("description")}
            className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
          />
          {errors.description && (
            <p role="alert" className="text-xs text-danger">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="achievements" className="text-sm font-medium text-parchment">
            Logros / &quot;XP obtenida&quot; (uno por línea, opcional)
          </label>
          <textarea
            id="achievements"
            rows={4}
            {...register("achievements")}
            className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-parchment">
          <input
            type="checkbox"
            {...register("unlocked")}
            className="h-4 w-4 rounded border-white/20 bg-obsidian/60 accent-emerald-glow"
          />
          Desbloqueado (visible en el Skill Tree)
        </label>

        <Button type="submit" variant="cta" className="w-fit" disabled={savePending}>
          {savePending ? "Guardando…" : "Guardar"}
        </Button>
      </form>

      {initialValues && (
        <ConfirmDialog
          open={confirmDeleteOpen}
          title={`¿Eliminar "${initialValues.label}"?`}
          description="Esta acción no se puede deshacer — el nodo se borra de la base de datos y desaparece del Skill Tree público."
          pending={deletePending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
      )}
    </Card>
  );
}
