"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { type BaseSyntheticEvent, type ReactNode, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ImageUploader } from "@/components/eter/ImageUploader";
import {
  Button,
  Card,
  ColorSwatchInput,
  ConfirmDialog,
  EntityActionsMenu,
  PreviewLink,
} from "@/components/hefesto/ui";
import { deleteQuestAction, duplicateQuestAction, saveQuestAction } from "@/lib/minerva/actions/quest-actions";
import { initialActionState } from "@/lib/minerva/actions/action-state";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { type Quest } from "@/lib/demeter/schemas";
import { type QuestEnDraft } from "@/lib/demeter/queries/quests";
import { cn } from "@/lib/utils";
import { QuestFormSchema, type QuestFormValues } from "./quest-form-schema";

interface QuestFormProps {
  /** Valores iniciales de UNA Quest — hoy viene de `getQuests({ includeDrafts: true })` (Deméter). */
  initialValues?: Quest;
  /**
   * Borrador de traducción EN — Iteración 32 ("i18n Absoluto"), fix de la
   * precarga que la Iteración 31 dejó pendiente. Viene de
   * `getQuestsRaw()` + `extractQuestEnDraft()` (`quests.ts`), resuelto
   * por `/admin/quests` (vía `QuestsManager`) a partir de la MISMA fila
   * cruda que `initialValues` — no es un fetch aparte. `undefined` en la
   * Quest "Nueva" (no hay nada que precargar todavía).
   */
  initialValuesEn?: QuestEnDraft;
  /**
   * Iteración 17 ("Escalabilidad del CMS", Hefesto — "Layout de
   * Acordeón"): cuando es `true` (y hay `initialValues`), la tarjeta
   * arranca colapsada mostrando sólo el encabezado (drag handle, título,
   * estado Publicado/Borrador, menú ⋮) y se expande al hacer click sobre
   * él, revelando el formulario completo. El formulario NUNCA se
   * desmonta al colapsar (sólo se anima su altura a 0) — así no se
   * pierde texto tipeado a medio terminar si el usuario cierra la
   * tarjeta por error. La Quest "Nueva" (sin `initialValues`) ignora
   * esta prop: siempre queda expandida, no tiene qué colapsar.
   */
  collapsible?: boolean;
  /**
   * Ícono de "agarrar y arrastrar" (`DragHandle` de Hefesto, ya cableado
   * a `useSortable()` por el componente que arma la lista —
   * `QuestsManager.tsx`). `undefined` en la Quest "Nueva": no es
   * arrastrable, no está dentro del `SortableContext`.
   */
  dragHandle?: ReactNode;
}

/**
 * QuestForm — Minerva, Iteración 15 ("Refinamiento de la Forja Oculta"),
 * extendido en la 17 ("Escalabilidad del CMS") con soporte de acordeón +
 * drag handle (ver `collapsible`/`dragHandle` arriba). Persiste de
 * verdad contra Supabase (`saveQuestAction`,
 * `src/lib/minerva/actions/quest-actions.ts`).
 *
 *  - `<form action={saveFormAction} method="post" onSubmit={...}>`: el
 *    `onSubmit` de `react-hook-form` sigue dando validación instantánea
 *    por campo (UX), pero si el JS nunca llega a hidratar, `action` +
 *    `method="post"` hacen que el navegador someta el formulario a este
 *    Server Action igual, por POST real.
 *  - `isPublished` (checkbox, Iteración 16) reemplaza al viejo valor
 *    `"draft"` de `status`.
 *  - `ColorSwatchInput` en vez de `<input>` plano para `accentColor` y el
 *    gradiente.
 *  - `EntityActionsMenu` (⋮) con Duplicar/Eliminar — Eliminar pasa por
 *    `ConfirmDialog` antes de tocar la base.
 *  - Toasts de éxito/error vía `useAdminToastStore` en las 3 acciones.
 */
export function QuestForm({ initialValues, initialValuesEn, collapsible = false, dragHandle }: QuestFormProps) {
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initialValues?.media?.type === "image" ? initialValues.media.src : null
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const isCollapsible = collapsible && Boolean(initialValues);
  const [isOpen, setIsOpen] = useState(!isCollapsible);
  // Iteración 31 (Minerva/Hefesto, i18n) — toggle ES/EN: decide qué set de
  // inputs (español o su traducción al inglés) se muestra para los campos
  // traducibles (title/summary/role + los 4 capítulos). Ambos sets quedan
  // SIEMPRE montados en el DOM (sólo se ocultan con `hidden`) para que
  // react-hook-form no pierda su valor al cambiar de pestaña.
  const [formLang, setFormLang] = useState<"es" | "en">("es");
  const pushToast = useAdminToastStore((state) => state.push);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuestFormValues>({
    resolver: zodResolver(QuestFormSchema),
    defaultValues: {
      id: initialValues?.id ?? "",
      title: initialValues?.title ?? "",
      summary: initialValues?.summary ?? "",
      role: initialValues?.role ?? "",
      tech: initialValues?.tech.join(", ") ?? "",
      href: initialValues?.href ?? "",
      status: initialValues?.status ?? "completed",
      isPublished: initialValues?.isPublished ?? true,
      accentColor: initialValues?.accentColor ?? "#34d399",
      placeholderFrom: initialValues?.imagePlaceholder.from ?? "#0a0a0f",
      placeholderTo: initialValues?.imagePlaceholder.to ?? "#0f6b4f",
      problem: initialValues?.caseStudy.problem ?? "",
      uxProcess: initialValues?.caseStudy.uxProcess ?? "",
      uiSolution: initialValues?.caseStudy.uiSolution ?? "",
      impact: initialValues?.caseStudy.impact ?? "",
      // Iteración 32 (i18n) — fix de la precarga: `initialValuesEn` trae
      // las traducciones existentes desde `getQuestsRaw()` (ver el
      // docblock de la prop más arriba); en la Quest "Nueva" no hay
      // `initialValuesEn`, así que cada campo cae a `""` como antes.
      titleEn: initialValuesEn?.titleEn ?? "",
      summaryEn: initialValuesEn?.summaryEn ?? "",
      roleEn: initialValuesEn?.roleEn ?? "",
      problemEn: initialValuesEn?.problemEn ?? "",
      uxProcessEn: initialValuesEn?.uxProcessEn ?? "",
      uiSolutionEn: initialValuesEn?.uiSolutionEn ?? "",
      impactEn: initialValuesEn?.impactEn ?? "",
    },
  });

  const [saveState, saveFormAction, savePending] = useActionState(saveQuestAction, initialActionState);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteQuestAction, initialActionState);
  const [duplicateState, duplicateFormAction, duplicatePending] = useActionState(
    duplicateQuestAction,
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

  function onValidSubmit(_values: QuestFormValues, event?: BaseSyntheticEvent) {
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

  const accentColor = watch("accentColor");
  const placeholderFrom = watch("placeholderFrom");
  const placeholderTo = watch("placeholderTo");
  const liveTitle = watch("title");
  const liveIsPublished = watch("isPublished");
  const isPending = savePending || deletePending || duplicatePending;

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
                {liveTitle || "Quest sin título"}
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
            <h2 className="font-display text-xl text-parchment">Quest</h2>
          )}
        </div>
        {initialValues && (
          <div className="flex shrink-0 items-center gap-2">
            {/* "Ver Preview" (Hefesto, Iteración 18) — sólo tiene sentido
                para una Quest ya guardada (necesita el `id`/slug real de
                `/quests/[slug]`); la Quest "Nueva" (sin `initialValues`)
                no la tiene todavía. */}
            <PreviewLink slug={`/quests/${initialValues.id}`} />
            <EntityActionsMenu
              entityLabel={`Quest "${initialValues.title}"`}
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
            key="quest-form-body"
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
              {/* Iteración 31 (Hefesto, i18n) — toggle ES/EN pedido por Deméter
                  ("un toggle que permita editar los campos en ambos idiomas").
                  Sólo afecta a los campos traducibles (título/resumen/rol +
                  los 4 capítulos) — el resto del formulario (id, tech, color,
                  imagen, etc.) es idioma-agnóstico y sigue siempre visible. */}
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
                <label htmlFor="id" className="text-sm font-medium text-parchment">
                  Id / slug (usado en /quests/[slug])
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

              <div hidden={formLang !== "es"} className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-sm font-medium text-parchment">
                  Título
                </label>
                <input
                  id="title"
                  {...register("title")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.title && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div hidden={formLang !== "en"} className="flex flex-col gap-1.5">
                <label htmlFor="titleEn" className="text-sm font-medium text-parchment">
                  Title (EN)
                </label>
                <input
                  id="titleEn"
                  {...register("titleEn")}
                  placeholder="Sin traducir — usa el título en español"
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
              </div>

              <div hidden={formLang !== "es"} className="flex flex-col gap-1.5">
                <label htmlFor="summary" className="text-sm font-medium text-parchment">
                  Resumen
                </label>
                <textarea
                  id="summary"
                  rows={3}
                  {...register("summary")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.summary && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.summary.message}
                  </p>
                )}
              </div>
              <div hidden={formLang !== "en"} className="flex flex-col gap-1.5">
                <label htmlFor="summaryEn" className="text-sm font-medium text-parchment">
                  Summary (EN)
                </label>
                <textarea
                  id="summaryEn"
                  rows={3}
                  {...register("summaryEn")}
                  placeholder="Untranslated — falls back to the Spanish summary"
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div hidden={formLang !== "es"} className="flex flex-col gap-1.5">
                  <label htmlFor="role" className="text-sm font-medium text-parchment">
                    Rol
                  </label>
                  <input
                    id="role"
                    {...register("role")}
                    className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                  />
                  {errors.role && (
                    <p role="alert" className="text-xs text-danger">
                      {errors.role.message}
                    </p>
                  )}
                </div>
                <div hidden={formLang !== "en"} className="flex flex-col gap-1.5">
                  <label htmlFor="roleEn" className="text-sm font-medium text-parchment">
                    Role (EN)
                  </label>
                  <input
                    id="roleEn"
                    {...register("roleEn")}
                    placeholder="Untranslated — falls back to the Spanish role"
                    className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="status" className="text-sm font-medium text-parchment">
                    Estado
                  </label>
                  <select
                    id="status"
                    {...register("status")}
                    className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                  >
                    <option value="completed">completed</option>
                    <option value="in-progress">in-progress</option>
                  </select>
                </div>
              </div>

              {/* Iteración 16 ("CMS V2"): reemplaza al viejo valor "draft" de
                  `status` — mismo patrón/checkbox que "Desbloqueado" en
                  SkillsForm y "Publicado" en InventoryForm, unificando el
                  concepto de borrador en todo el CMS. */}
              <label className="flex items-center gap-2 text-sm text-parchment">
                <input
                  type="checkbox"
                  {...register("isPublished")}
                  className="h-4 w-4 rounded border-white/20 bg-obsidian/60 accent-emerald-glow"
                />
                Publicado (visible en /quests — desmarcá para dejarla en borrador)
              </label>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech" className="text-sm font-medium text-parchment">
                  Tecnologías (separadas por coma)
                </label>
                <input
                  id="tech"
                  {...register("tech")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.tech && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.tech.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="href" className="text-sm font-medium text-parchment">
                  Link &quot;Ver en vivo&quot; (opcional)
                </label>
                <input
                  id="href"
                  {...register("href")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.href && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.href.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="accentColor" className="text-sm font-medium text-parchment">
                    Color de acento
                  </label>
                  <ColorSwatchInput id="accentColor" value={accentColor} {...register("accentColor")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="placeholderFrom" className="text-sm font-medium text-parchment">
                    Gradiente (from)
                  </label>
                  <ColorSwatchInput id="placeholderFrom" value={placeholderFrom} {...register("placeholderFrom")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="placeholderTo" className="text-sm font-medium text-parchment">
                    Gradiente (to)
                  </label>
                  <ColorSwatchInput id="placeholderTo" value={placeholderTo} {...register("placeholderTo")} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-white/10 pt-5">
                <span className="text-sm font-medium text-parchment">Imagen de portada</span>
                <ImageUploader
                  folder="uploads"
                  onUploadComplete={(publicUrl) => setCoverImageUrl(publicUrl)}
                />
                {coverImageUrl && (
                  <p className="break-all text-xs text-parchment-muted/70">{coverImageUrl}</p>
                )}
              </div>

              <div hidden={formLang !== "es"} className="flex flex-col gap-1.5 border-t border-white/10 pt-5">
                <label htmlFor="problem" className="text-sm font-medium text-parchment">
                  Capítulo I — El Problema
                </label>
                <textarea
                  id="problem"
                  rows={3}
                  {...register("problem")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.problem && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.problem.message}
                  </p>
                )}
              </div>
              <div hidden={formLang !== "en"} className="flex flex-col gap-1.5 border-t border-white/10 pt-5">
                <label htmlFor="problemEn" className="text-sm font-medium text-parchment">
                  Chapter I — The Problem
                </label>
                <textarea
                  id="problemEn"
                  rows={3}
                  {...register("problemEn")}
                  placeholder="Untranslated — falls back to the Spanish chapter"
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
              </div>

              <div hidden={formLang !== "es"} className="flex flex-col gap-1.5">
                <label htmlFor="uxProcess" className="text-sm font-medium text-parchment">
                  Capítulo II — El Proceso UX
                </label>
                <textarea
                  id="uxProcess"
                  rows={3}
                  {...register("uxProcess")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.uxProcess && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.uxProcess.message}
                  </p>
                )}
              </div>
              <div hidden={formLang !== "en"} className="flex flex-col gap-1.5">
                <label htmlFor="uxProcessEn" className="text-sm font-medium text-parchment">
                  Chapter II — The UX Process
                </label>
                <textarea
                  id="uxProcessEn"
                  rows={3}
                  {...register("uxProcessEn")}
                  placeholder="Untranslated — falls back to the Spanish chapter"
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
              </div>

              <div hidden={formLang !== "es"} className="flex flex-col gap-1.5">
                <label htmlFor="uiSolution" className="text-sm font-medium text-parchment">
                  Capítulo III — La Solución UI
                </label>
                <textarea
                  id="uiSolution"
                  rows={3}
                  {...register("uiSolution")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.uiSolution && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.uiSolution.message}
                  </p>
                )}
              </div>
              <div hidden={formLang !== "en"} className="flex flex-col gap-1.5">
                <label htmlFor="uiSolutionEn" className="text-sm font-medium text-parchment">
                  Chapter III — The UI Solution
                </label>
                <textarea
                  id="uiSolutionEn"
                  rows={3}
                  {...register("uiSolutionEn")}
                  placeholder="Untranslated — falls back to the Spanish chapter"
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
              </div>

              <div hidden={formLang !== "es"} className="flex flex-col gap-1.5">
                <label htmlFor="impact" className="text-sm font-medium text-parchment">
                  Capítulo IV — El Impacto
                </label>
                <textarea
                  id="impact"
                  rows={3}
                  {...register("impact")}
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
                {errors.impact && (
                  <p role="alert" className="text-xs text-danger">
                    {errors.impact.message}
                  </p>
                )}
              </div>
              <div hidden={formLang !== "en"} className="flex flex-col gap-1.5">
                <label htmlFor="impactEn" className="text-sm font-medium text-parchment">
                  Chapter IV — The Impact
                </label>
                <textarea
                  id="impactEn"
                  rows={3}
                  {...register("impactEn")}
                  placeholder="Untranslated — falls back to the Spanish chapter"
                  className="rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
                />
              </div>

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
          title={`¿Eliminar "${initialValues.title}"?`}
          description="Esta acción no se puede deshacer — la Quest se borra de la base de datos y desaparece del sitio público (si estaba publicada)."
          pending={deletePending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
      )}
    </Card>
  );
}
