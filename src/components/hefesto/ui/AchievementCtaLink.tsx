"use client";

import { type AnchorHTMLAttributes } from "react";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";

interface AchievementCtaLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  achievementId: string;
}

/**
 * AchievementCtaLink — Hefesto/Minerva (Iteración 10). Wrapper mínimo de
 * `<a>` que dispara `unlock(achievementId)` en `onClick` antes de dejar
 * seguir la navegación normal del link (mailto/descarga/ancla). Existe
 * para poder disparar el logro "Llamado a la Aventura" desde los CTAs
 * "Iniciar Quest"/"Descargar CV" que viven en `Navbar`/`Footer` (Server
 * Components) SIN convertir esas secciones enteras a Client Components —
 * sólo este link puntual necesita JS. En `Hero`/`MobileMenu` (que ya son
 * Client Components) se puede llamar `unlock(...)` directo en el `onClick`
 * existente; acá no hay ese contexto disponible.
 */
export function AchievementCtaLink({
  achievementId,
  onClick,
  children,
  ...props
}: AchievementCtaLinkProps) {
  const unlock = useAchievementsStore((state) => state.unlock);

  return (
    <a
      {...props}
      onClick={(event) => {
        unlock(achievementId);
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
