"use client";

import { useEffect } from "react";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";

const DWELL_MS = 15_000;

/**
 * QuestDwellTracker — Minerva/Hefesto (Iteración 13). Logro "Erudito de la
 * UI": desbloquea si el visitante se queda 15s+ en la página de un caso de
 * estudio (`/quests/[slug]`) — sentinel invisible, montado una vez ahí.
 *
 * Deliberadamente NO vive en `QuestShowcase` (la grilla de cartas del
 * Home): el logro premia "leer un caso de estudio completo", no "ver la
 * home 15 segundos" — son intenciones distintas y `QuestShowcase` no tiene
 * forma de saber si el visitante está leyendo o scrolleando de paso.
 *
 * El timer se limpia al desmontar (navegar a otra Quest o volver a Home
 * antes de los 15s): irse rápido no debería contar como "erudito".
 */
export function QuestDwellTracker() {
  const unlock = useAchievementsStore((state) => state.unlock);

  useEffect(() => {
    const timer = setTimeout(() => unlock("ui-scholar"), DWELL_MS);
    return () => clearTimeout(timer);
  }, [unlock]);

  return null;
}
