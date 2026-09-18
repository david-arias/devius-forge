"use client";

import { Trophy } from "lucide-react";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";
import { cn } from "@/lib/utils";

interface AchievementsDrawerTriggerProps {
  className?: string;
}

/**
 * AchievementsDrawerTrigger — Hefesto/Minerva (Iteración 12). Botón mínimo
 * (mismo criterio que `AchievementCtaLink`) para poder abrir el
 * `AchievementsDrawer` desde `Navbar` (Server Component) sin convertirlo
 * entero a Client Component. Muestra un punto esmeralda cuando hay al
 * menos un logro desbloqueado — señal sutil de "hay algo para ver acá"
 * sin necesitar un contador numérico que compita visualmente con el resto
 * del Navbar.
 */
export function AchievementsDrawerTrigger({ className }: AchievementsDrawerTriggerProps) {
  const toggleDrawer = useAchievementsStore((state) => state.toggleDrawer);
  const hasUnlocked = useAchievementsStore((state) => state.unlockedIds.length > 0);

  return (
    <button
      type="button"
      onClick={toggleDrawer}
      aria-label="Ver logros"
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-md text-parchment-muted transition-colors duration-150 hover:bg-carbon-elevated hover:text-parchment",
        className
      )}
    >
      <Trophy className="h-[1.1rem] w-[1.1rem]" aria-hidden />
      {hasUnlocked && (
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-glow shadow-[0_0_6px_1px_rgba(52,211,153,0.7)]"
        />
      )}
    </button>
  );
}
