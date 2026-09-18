"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { type BaseSyntheticEvent, type ReactNode, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Card, ConfirmDialog, EntityActionsMenu, PreviewLink } from "@/components/hefesto/ui";
import { initialActionState } from "@/lib/minerva/actions/action-state";
import {
  deleteInventoryItemAction,
  duplicateInventoryItemAction,
  saveInventoryItemAction,
} from "@/lib/minerva/actions/inventory-actions";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { type InventoryItem } from "@/lib/demeter/schemas";
import { cn } from "@/lib/utils";
import { InventoryFormSchema, type InventoryFormValues } from "./inventory-form-schema";

interface InventoryFormProps {
  /** Valores iniciales de UN ítem — hoy viene de `getInventory()` (Deméter). */
  initialValues?: InventoryItem;
  /**
   * Iteración 17 ("Escalabilidad del CMS", Hefesto — "Layout de
   * Acordeón"): arranca colapsado (sólo header: drag handle, nombre,
   * estado Publicado/Borrador, menú ⋮) y se expande al click. Ver el
   * comentario largo equivalente en `QuestForm.tsx`. El ítem "Nuevo"
   * (sin `initialValues`) ignora esta prop.
   */
  collapsible?: boolean;
  /** Ícono de drag handle ya cableado a `useSortable()` por `InventoryManager.tsx`. */
  dragHandle?: ReactNode;
}

const CATEGORIES = ["frontend", "backend", "design", "devops", "tools", "animation"] as const;
const RARITIES = ["common", "rare", "legendary"] as const;

/**
 * InventoryForm — Minerva, Iteración 15 ("Refinamiento de la Forja
 * Oculta"), extendido en la 17 ("Escalabilidad del CMS") con acordeón +
 * drag handle. Mismo tratamiento que `QuestForm.tsx`/`SkillsForm.tsx`:
 * persiste de verdad (`saveInventoryItemAction`), `method="post"` +
 * Server Action como `action` del `<form>`, `EntityActionsMenu` con
 * Duplicar/Eliminar, y Toasts.
 */
export function InventoryForm({ initialValues, collapsible = false, dragHandle }: InventoryFormProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const isCollapsible = collapsible && Boolean(initialValues);
  const [isOpen, setIsOpen] = useState(!isCollapsible);
  const pushToast = useAdminToastStore((state) => state.push);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(InventoryFormSchema),
    defaultValues: {
      id: initialValues?.id ?? "",
      name: initialValues?.name ?? "",
      category: initialValues?.category ?? "frontend",
      rarity: initialValues?.rarity ?? "common",
      level: initialValues?.level ?? 50,
      isPublished: initialValues?.isPublished ?? true,
    },
  });

  const [saveState, saveFormAction, savePending] = useActionState(
    saveInventoryItemAction,
    initialActionState
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteInventoryItemAction,
    initialActionState
  );
  const [duplicateState, duplicateFormAction, duplicatePending] = useActionState(
    duplicateInventoryItemAction,
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

  function onValidSubmit(_values: InventoryFormValues, event?: BaseSyntheticEvent) {
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
  const liveName = watch("name");
  const liveIsPublished = watch("isPublished");

  return (
    <Card className="max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {dragHandle}
          {isCollapsible ? (
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              aria-expanded={isOpen}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-1 text-left transition-colors duration-150 hover:text-parchment"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-parchment-muted transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
                aria-hidden
              />
              <h2 className="min-w-0 truncate font-display text-xl text-parchment">
                {liveName || "Ítem sin nombre"}
              </h2>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  liveIsPublished
                    ? "border-emerald-glow/40 text-emerald-glow"
                    : "border-white/15 text-parchment-muted"
                )}
              >
                {liveIsPublished ? "Publicado" : "Borrador"}
              </span>
            </button>
          ) : (
            <h2 className="font-display text-xl text-parchment">Inventario — ítem</h2>
          )}
        </div>
        {initialValues && (
          <div className="flex shrink-0 items-center gap-2">
            {/* El Inventario no tiene página propia — previsualiza la
                sección "#inventario" de la home (Hefesto, Iteración 18). */}
            <PreviewLink slug="/#inventario" />
            <EntityActionsMenu
              entityLabel={`ítem "${initialValues.name}"`}
              onDuplicate={handleDuplicate}
              onDelete={() => setConfirmDeleteOpen(true)}
              disabled={isPending}
            />
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="inventory-form-body"
            initial={isCollapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
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
                <label htmlFor="name" className="text-sm font-medium text-parchment">
                  Nombre
                </label>
                <input
                  id="name"
                  {...register("name")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.name && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="category" className="text-sm font-medium text-parchment">
                    Categoría
                  </label>
                  <select
                    id="category"
                    {...register("category")}
                    className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rarity" className="text-sm font-medium text-parchment">
                    Rareza
                  </label>
                  <select
                    id="rarity"
                    {...register("rarity")}
                    className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                  >
                    {RARITIES.map((rarity) => (
                      <option key={rarity} value={rarity}>
                        {rarity}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="level" className="text-sm font-medium text-parchment">
                    Nivel de dominio
                  </label>
                  <span
                    aria-hidden
                    className="rounded-full border border-gold-deep/50 bg-gold-glow/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-gold-glow"
                  >
                    {watch("level")}
                  </span>
                </div>
                <input
                  id="level"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  aria-valuetext={`${watch("level")} de 100`}
                  {...register("level", { valueAsNumber: true })}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-obsidian/60 accent-emerald-glow"
                />
                {errors.level && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.level.message}
                  </p>
                )}
              </div>

              {/* Mismo patrón que "Desbloqueado" (SkillsForm) y "Publicado"
                  (QuestForm) — unifica el concepto de borrador en todo el CMS
                  (Iteración 16, "CMS V2"). */}
              <label className="flex items-center gap-2 text-sm text-parchment">
                <input
                  type="checkbox"
                  {...register("isPublished")}
                  className="h-4 w-4 rounded border-white/20 bg-obsidian/60 accent-emerald-glow"
                />
                Publicado (visible en el Inventario)
              </label>

              <Button type="submit" variant="cta" className="w-fit" disabled={savePending}>
                {savePending ? "Guardando…" : "Guardar"}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {initialValues && (
        <ConfirmDialog
          open={confirmDeleteOpen}
          title={`¿Eliminar "${initialValues.name}"?`}
          description="Esta acción no se puede deshacer — el ítem se borra de la base de datos y desaparece del Inventario público."
          pending={deletePending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
      )}
    </Card>
  );
}
