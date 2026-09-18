"use client";

import { Search } from "lucide-react";
import { useCommandPaletteStore } from "@/lib/minerva/command-palette-store";
import { cn } from "@/lib/utils";

interface CommandPaletteTriggerProps {
  className?: string;
}

/**
 * CommandPaletteTrigger — Hefesto/Minerva, Iteración 29. Mismo criterio
 * que `AchievementsDrawerTrigger`: botón mínimo para poder abrir
 * `CommandPalette` (montado en `SiteChrome`) desde `Navbar` (Server
 * Component) sin convertirlo entero a Client Component.
 *
 * Accesibilidad (HADES): `Cmd/Ctrl+K` es la vía rápida para quien ya la
 * conoce, pero un visitante que nunca usó ese atajo necesita un botón
 * visible y enfocable por teclado — nunca un atajo "invisible" como
 * única puerta de entrada a una feature.
 */
export function CommandPaletteTrigger({ className }: CommandPaletteTriggerProps) {
  const openPalette = useCommandPaletteStore((state) => state.openPalette);

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-label="Abrir paleta de comandos"
      className={cn(
        "group relative flex h-9 items-center gap-2 rounded-md px-2 text-parchment-muted transition-colors duration-150 hover:bg-carbon-elevated hover:text-parchment",
        className
      )}
    >
      <Search className="h-[1.1rem] w-[1.1rem]" aria-hidden />
      <kbd
        aria-hidden
        className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-sans text-[0.65rem] font-medium text-parchment-muted/80 group-hover:text-parchment md:inline-block"
      >
        ⌘K
      </kbd>
    </button>
  );
}
