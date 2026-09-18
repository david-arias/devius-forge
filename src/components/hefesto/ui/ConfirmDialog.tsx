"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId } from "react";
import { useDialogPanel } from "@/lib/hefesto/use-dialog-panel";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog — Hefesto, Iteración 15 (auditoría 2026-09-15, Hallazgo
 * de Alto Impacto: "eliminar... debe tener un modal o alert de
 * confirmación"). Genérico a propósito — lo usan `QuestForm`/`SkillsForm`/
 * `InventoryForm` antes de disparar su `delete*Action` respectivo, en vez
 * de un `window.confirm()` nativo (inconsistente visualmente y sin
 * foco/teclado accesible garantizado entre navegadores).
 *
 * Reutiliza `useDialogPanel` (Hefesto, ya usado por `MobileMenu`/
 * `AchievementsDrawer`) para el mismo focus trap + cierre con Escape +
 * restauración de foco — un modal de confirmación no debería reimplementar
 * esa mecánica de accesibilidad por tercera vez.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelId = useId();
  const panelRef = useDialogPanel<HTMLDivElement>(open, onCancel);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            aria-hidden
            onClick={onCancel}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            id={panelId}
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`${panelId}-title`}
            aria-describedby={`${panelId}-desc`}
            className="fixed left-1/2 top-1/2 z-[91] w-[min(26rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-obsidian-soft p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <h2 id={`${panelId}-title`} className="font-display text-lg text-parchment">
              {title}
            </h2>
            <p id={`${panelId}-desc`} className="mt-2 text-sm text-parchment-muted">
              {description}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onConfirm}
                disabled={pending}
                className="bg-danger text-parchment shadow-none hover:bg-danger/90 hover:shadow-[0_0_18px_-6px_rgba(220,38,38,0.6)]"
              >
                {pending ? "Eliminando…" : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
