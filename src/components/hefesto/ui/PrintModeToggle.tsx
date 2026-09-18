"use client";

import { Printer } from "lucide-react";
import { usePrintModeStore } from "@/lib/minerva/print-mode-store";
import { cn } from "@/lib/utils";

interface PrintModeToggleProps {
  className?: string;
}

/**
 * PrintModeToggle — Hades/Hefesto, Iteración 30. Botón mínimo (mismo
 * criterio que el resto de los triggers del sitio) para alternar
 * `print-mode-store.ts` entre Eco/Premium sin pasar por la Command
 * Palette. Vive en el Footer — el lugar donde alguien que ya decidió
 * "quiero imprimir/exportar esto" probablemente está mirando — y también
 * es una de las acciones de `CommandPalette.tsx`.
 */
export function PrintModeToggle({ className }: PrintModeToggleProps) {
  const mode = usePrintModeStore((state) => state.mode);
  const toggleMode = usePrintModeStore((state) => state.toggleMode);

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={`Modo de impresión: ${mode === "eco" ? "Eco" : "Premium"} — cambiar a ${mode === "eco" ? "Premium" : "Eco"}`}
      title="Ctrl/Cmd+P usa este modo"
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-1 text-xs text-parchment-muted transition-colors hover:text-parchment",
        className
      )}
    >
      <Printer className="h-3.5 w-3.5" aria-hidden />
      Impresión: {mode === "eco" ? "Eco" : "Premium"}
    </button>
  );
}
