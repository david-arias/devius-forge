"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type BaseSyntheticEvent, type ReactNode, useActionState, useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { useForm, useWatch } from "react-hook-form";
import { Button, Card, ConfirmDialog, EntityActionsMenu, PreviewLink } from "@/components/hefesto/ui";
import { initialActionState } from "@/lib/minerva/actions/action-state";
import {
  deleteSkillNodeAction,
  duplicateSkillNodeAction,
  saveSkillNodeAction,
} from "@/lib/minerva/actions/skill-actions";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { type SkillNode } from "@/lib/demeter/schemas";
import { type SkillNodeEnDraft } from "@/lib/demeter/queries/skill-tree";
import { SkillsFormSchema, type SkillsFormValues } from "./skills-form-schema";

interface SkillsFormProps {
  /** Valores iniciales de UN nodo — hoy viene de `getSkillTree()` (Deméter). */
  initialValues?: SkillNode;
  /** Borrador de traducción EN — Iteración 32 ("i18n Absoluto"), viene de `getSkillTreeEnDrafts()` (Deméter). */
  initialValuesEn?: SkillNodeEnDraft;
  /**
   * Ícono de "agarrar y arrastrar" (Iteración 17, "Escalabilidad del
   * CMS") — ya cableado a `useSortable()` por `SkillTreeManager.tsx`.
   * Desde la Iteración 42 el Skill Tree también tiene acordeón (ver
   * `collapsible`) y flechas de reordenamiento (`onMoveUp`/`onMoveDown`).
   */
  dragHandle?: ReactNode;
  /**
   * Iteración 42 (Hefesto & Minerva, "Acordeón en Skill Tree"): si es
   * `true` y el nodo ya existe (`initialValues`), el formulario arranca
   * COLAPSADO y la cabecera muestra sólo el título (+ período y estado);
   * al expandir aparece el formulario completo. Mismo patrón que
   * `QuestForm` (`collapsible`). El nodo "Nuevo" nunca colapsa.
   */
  collapsible?: boolean;
  /**
   * Reordenamiento por flechas (Iteración 42, bonus) — alternativa
   * precisa y accesible al Drag & Drop. `SkillTreeManager` decide qué
   * hacer; acá sólo se pintan los botones. Sin callback = sin botón.
   */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** Posición 1-based y total — sólo para el `aria-label` de las flechas y el chip "#n". */
  position?: { index: number; total: number };
}

const moveButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-parchment-muted transition-colors duration-150 hover:border-emerald-glow/40 hover:text-emerald-glow disabled:pointer-events-none disabled:opacity-30";

/**
 * SkillsForm — Minerva, Iteración 15 ("Refinamiento de la Forja Oculta").
 * Mismo tratamiento que `QuestForm.tsx`: persiste de verdad
 * (`saveSkillNodeAction`), `method="post"` + Server Action como `action`
 * del `<form>` (fallback nativo seguro sin JS), `EntityActionsMenu` con
 * Duplicar/Eliminar (Eliminar detrás de `ConfirmDialog`), y Toasts de
 * éxito/error. No tiene campos de color — no aplica `ColorSwatchInput`.
 */
export function SkillsForm({
  initialValues,
  initialValuesEn,
  dragHandle,
  collapsible = false,
  onMoveUp,
  onMoveDown,
  position,
}: SkillsFormProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const isCollapsible = collapsible && Boolean(initialValues);
  const [isOpen, setIsOpen] = useState(!isCollapsible);
  // Iteración 42 — ids únicos por instancia: con varios acordeones abiertos
  // a la vez, `id="label"` repetido rompía la asociación <label>↔<input>
  // (y el lector de pantalla leía la etiqueta del primer nodo en todos).
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  const bodyId = fid("body");
  // Iteración 32 (Hefesto, i18n) — mismo toggle ES/EN que `QuestForm.tsx`.
  const [formLang, setFormLang] = useState<"es" | "en">("es");
  const pushToast = useAdminToastStore((state) => state.push);

  const {
    register,
    handleSubmit,
    control,
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
      labelEn: initialValuesEn?.labelEn ?? "",
      descriptionEn: initialValuesEn?.descriptionEn ?? "",
      achievementsEn: initialValuesEn?.achievementsEn ?? "",
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
  // Título "en vivo" de la cabecera del acordeón — `useWatch` (no `watch()`)
  // para que el React Compiler pueda seguir memoizando este componente.
  const [liveLabel, livePeriod, liveUnlocked] = useWatch({ control, name: ["label", "period", "unlocked"] });

  return (
    <Card className="max-w-2xl">
      <div className={cn("flex items-start justify-between gap-3", isOpen && "mb-6")}>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {dragHandle}
          {isCollapsible ? (
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              aria-expanded={isOpen}
              aria-controls={isOpen ? bodyId : undefined}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-1 text-left transition-colors duration-150 hover:text-parchment"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-parchment-muted transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
                aria-hidden
              />
              {position && (
                <span className="shrink-0 font-mono text-xs text-parchment-muted/70" aria-hidden>
                  #{position.index}
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className="min-w-0 truncate font-display text-lg text-parchment">
                  {liveLabel || "Nodo sin título"}
                </span>
                {livePeriod && <span className="truncate text-xs text-parchment-muted">{livePeriod}</span>}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  liveUnlocked ? "border-emerald-glow/40 text-emerald-glow" : "border-white/15 text-parchment-muted"
                )}
              >
                {liveUnlocked ? "Visible" : "Oculto"}
              </span>
            </button>
          ) : (
            <h2 className="font-display text-xl text-parchment">Skill Tree — nodo</h2>
          )}
        </div>
        {initialValues && (
          <div className="flex shrink-0 items-center gap-2">
            {/* Iteración 42 (bonus) — reordenar con flechas: ajusta el
                `sort_order` vía `SkillTreeManager` (mismo Server Action
                que el Drag & Drop). Deshabilitadas en los extremos. */}
            {(onMoveUp || onMoveDown) && (
              <div className="flex items-center gap-1" role="group" aria-label={`Reordenar nodo "${initialValues.label}"`}>
                <button
                  type="button"
                  onClick={onMoveUp}
                  disabled={!onMoveUp || isPending}
                  data-move={`${initialValues.id}-up`}
                  aria-label={`Subir nodo "${initialValues.label}"${position ? ` (posición ${position.index} de ${position.total})` : ""}`}
                  title="Subir"
                  className={moveButtonClass}
                >
                  <ChevronUp className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={onMoveDown}
                  disabled={!onMoveDown || isPending}
                  data-move={`${initialValues.id}-down`}
                  aria-label={`Bajar nodo "${initialValues.label}"${position ? ` (posición ${position.index} de ${position.total})` : ""}`}
                  title="Bajar"
                  className={moveButtonClass}
                >
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
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

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="skill-form-body"
            id={bodyId}
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
              {/* Iteración 32 (Hefesto, i18n) — mismo patrón de `QuestForm.tsx`. */}
              <div className="flex items-center gap-1 self-start rounded-lg border border-white/10 bg-obsidian/60 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFormLang("es")}
                  aria-pressed={formLang === "es"}
                  className={cn(
                    "rounded-md px-3 py-1 transition-colors duration-150",
                    formLang === "es" ? "bg-emerald-glow/20 text-emerald-glow" : "text-parchment-muted hover:text-parchment"
                  )}
                >
                  Español
                </button>
                <button
                  type="button"
                  onClick={() => setFormLang("en")}
                  aria-pressed={formLang === "en"}
                  className={cn(
                    "rounded-md px-3 py-1 transition-colors duration-150",
                    formLang === "en" ? "bg-emerald-glow/20 text-emerald-glow" : "text-parchment-muted hover:text-parchment"
                  )}
                >
                  English
                </button>
                <span className="px-2 text-[0.65rem] font-normal normal-case text-parchment-muted/70">
                  {formLang === "en" ? "Campos opcionales — vacío = usa el valor en español" : "Contenido base (obligatorio)"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={fid("id")} className="text-sm font-medium text-parchment">
                  Id (slug único)
                </label>
                <input
                  id={fid("id")}
                  {...register("id")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.id && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.id.message}
                  </p>
                )}
              </div>

              <div hidden={formLang !== "es"} className="flex flex-col gap-1.5">
                <label htmlFor={fid("label")} className="text-sm font-medium text-parchment">
                  Label (título del puesto)
                </label>
                <input
                  id={fid("label")}
                  {...register("label")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.label && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.label.message}
                  </p>
                )}
              </div>
              <div hidden={formLang !== "en"} className="flex flex-col gap-1.5">
                <label htmlFor={fid("labelEn")} className="text-sm font-medium text-parchment">
                  Label (EN)
                </label>
                <input
                  id={fid("labelEn")}
                  {...register("labelEn")}
                  placeholder="Untranslated — falls back to the Spanish label"
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={fid("period")} className="text-sm font-medium text-parchment">
                  Período (opcional, p.ej. &quot;2023 — presente&quot;)
                </label>
                <input
                  id={fid("period")}
                  {...register("period")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
              </div>

              <div hidden={formLang !== "es"} className="flex flex-col gap-1.5">
                <label htmlFor={fid("description")} className="text-sm font-medium text-parchment">
                  Descripción
                </label>
                <textarea
                  id={fid("description")}
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
              <div hidden={formLang !== "en"} className="flex flex-col gap-1.5">
                <label htmlFor={fid("descriptionEn")} className="text-sm font-medium text-parchment">
                  Description (EN)
                </label>
                <textarea
                  id={fid("descriptionEn")}
                  rows={3}
                  {...register("descriptionEn")}
                  placeholder="Untranslated — falls back to the Spanish description"
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
              </div>

              <div hidden={formLang !== "es"} className="flex flex-col gap-1.5">
                <label htmlFor={fid("achievements")} className="text-sm font-medium text-parchment">
                  Logros / &quot;XP obtenida&quot; (uno por línea, opcional)
                </label>
                <textarea
                  id={fid("achievements")}
                  rows={4}
                  {...register("achievements")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
              </div>
              <div hidden={formLang !== "en"} className="flex flex-col gap-1.5">
                <label htmlFor={fid("achievementsEn")} className="text-sm font-medium text-parchment">
                  Achievements (EN, one per line, optional)
                </label>
                <textarea
                  id={fid("achievementsEn")}
                  rows={4}
                  {...register("achievementsEn")}
                  placeholder="Untranslated — falls back to the Spanish achievements"
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
          </motion.div>
        )}
      </AnimatePresence>

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
