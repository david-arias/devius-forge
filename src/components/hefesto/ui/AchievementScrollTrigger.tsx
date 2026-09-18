"use client";

import { useEffect, useRef } from "react";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";

interface AchievementScrollTriggerProps {
  achievementId: string;
}

/**
 * AchievementScrollTrigger — Hefesto/Minerva (Iteración 10). Sentinel
 * invisible (`aria-hidden`, sin tamaño) que desbloquea un logro cuando
 * entra en viewport. Se monta DENTRO de `Footer` (ver `Footer.tsx`) para
 * el logro "Explorador de la Forja" sin convertir todo el Footer en un
 * Client Component — es la única parte de esa sección que necesita JS.
 *
 * `IntersectionObserver` en vez de un listener de `scroll` — más barato
 * (no corre en cada frame de scroll) y es exactamente para esto que existe
 * la API. `threshold: 0` + margen 0 = "ya es visible al menos 1px", que es
 * lo que se espera de "llegaste hasta el Footer" en un logro de exploración,
 * no una fracción específica de su altura.
 */
export function AchievementScrollTrigger({ achievementId }: AchievementScrollTriggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const unlock = useAchievementsStore((state) => state.unlock);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          unlock(achievementId);
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [achievementId, unlock]);

  return <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" />;
}
