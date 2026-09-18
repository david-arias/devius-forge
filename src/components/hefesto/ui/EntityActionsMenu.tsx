"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

interface EntityActionsMenuProps {
  /** Etiqueta accesible del ítem sobre el que actúa el menú, p.ej. `Quest "Oraculum"`. Se usa en `aria-label`. */
  entityLabel: string;
  onDuplicate?: () => void;
  onDelete?: () => void;
  duplicateLabel?: string;
  deleteLabel?: string;
  disabled?: boolean;
}

/**
 * EntityActionsMenu — Hefesto, Iteración 15 (auditoría 2026-09-15,
 * Hallazgo de Alto Impacto: "cada tarjeta de quest sólo tiene un botón:
 * Guardar... agregar por tarjeta un menú de acciones (⋮)"). Genérico:
 * lo usan `QuestForm`/`SkillsForm`/`InventoryForm` — `CharacterForm` no
 * (es una ficha única, no una colección con qué duplicar/eliminar).
 *
 * Dropdown simple con click-outside + Escape para cerrar, sin depender
 * de una librería de menús nueva (el proyecto no tiene Radix ni similar).
 * `onDelete` sólo dispara el callback — quien lo use (`QuestForm`, etc.)
 * es responsable de abrir un `ConfirmDialog` antes de llamar al Server
 * Action real, este menú no sabe nada de confirmaciones.
 */
export function EntityActionsMenu({
  entityLabel,
  onDuplicate,
  onDelete,
  duplicateLabel = "Duplicar",
  deleteLabel = "Eliminar",
  disabled = false,
}: EntityActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!onDuplicate && !onDelete) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Más acciones para ${entityLabel}`}
        className="flex h-9 w-9 items-center justify-center rounded-md text-parchment-muted transition-colors duration-150 hover:bg-carbon-elevated hover:text-parchment disabled:pointer-events-none disabled:opacity-50"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label={`Acciones para ${entityLabel}`}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-md border border-white/10 bg-obsidian-soft shadow-xl"
          >
            {onDuplicate && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onDuplicate();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-parchment transition-colors duration-150 hover:bg-carbon-elevated"
              >
                <Copy className="h-4 w-4" aria-hidden />
                {duplicateLabel}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-danger transition-colors duration-150 hover:bg-danger/10"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {deleteLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
