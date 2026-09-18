"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { getAchievementById } from "@/lib/demeter/queries/achievements";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";
import { useAudio } from "@/lib/hefesto/use-audio";
import { ACHIEVEMENT_ICON_FALLBACK, ACHIEVEMENT_ICONS } from "@/lib/hefesto/achievement-icons";

const AUTO_DISMISS_MS = 4200;

/**
 * AchievementToast — Hefesto (Iteración 10, gamificación RPG). Se monta UNA
 * vez en `layout.tsx` (mismo patrón que `<CustomCursor />`) y escucha la
 * `toastQueue` de `useAchievementsStore` (Minerva). Muestra el logro más
 * antiguo de la cola; si se desbloquea más de uno casi a la vez, se apilan
 * en fila (no se pisan) gracias a `AnimatePresence mode="popLayout"`.
 *
 * Diseño "notificación de videojuego" (ver MASTER.md → paleta): borde en
 * gradiente esmeralda→dorado brillante, entra deslizando desde abajo,
 * ícono con halo. Sonido opcional vía `useAudio().playAchievement()` —
 * mismo patrón lazy-init/fail-silent que el resto de `useAudio` (no rompe
 * nada si `/sfx/achievement-unlock.mp3` todavía no existe).
 *
 * Accesibilidad (HADES):
 *  - `role="status"` + `aria-live="polite"` en el contenedor: un lector de
 *    pantalla lo anuncia sin interrumpir lo que esté leyendo, y sin robar
 *    foco (nunca se mueve el foco del teclado hacia el Toast).
 *  - Auto-dismiss a los ~4.2s, pero además queda un botón "Cerrar" con
 *    foco alcanzable — nunca depende sólo del timeout para desaparecer.
 *  - `useReducedMotion()` cambia la entrada de "desliza desde abajo" a un
 *    fade simple, igual que el resto del motion del sitio.
 */
export function AchievementToast() {
  const toastQueue = useAchievementsStore((state) => state.toastQueue);
  const dismissToast = useAchievementsStore((state) => state.dismissToast);
  const prefersReducedMotion = useReducedMotion();
  const { playAchievement } = useAudio();

  const currentId = toastQueue[0];
  const achievement = currentId ? getAchievementById(currentId) : undefined;

  useEffect(() => {
    if (!achievement) return;

    playAchievement();
    const timer = setTimeout(dismissToast, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo re-disparar cuando cambia el logro mostrado, no en cada render de `playAchievement`/`dismissToast`.
  }, [achievement?.id]);

  const Icon = achievement ? (ACHIEVEMENT_ICONS[achievement.icon] ?? ACHIEVEMENT_ICON_FALLBACK) : ACHIEVEMENT_ICON_FALLBACK;

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex justify-center px-4 sm:bottom-6 sm:justify-end sm:px-6"
    >
      <AnimatePresence mode="popLayout">
        {achievement && (
          <motion.div
            key={achievement.id}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-gold-glow/40 bg-obsidian-soft/95 p-4 shadow-[0_0_0_1px_rgba(232,196,104,0.15),0_20px_48px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          >
            {/* Glow de borde esmeralda→dorado, siempre visible — "notificación de videojuego" */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-xl opacity-80"
              style={{
                padding: 1,
                background: "linear-gradient(135deg, var(--color-emerald-glow), var(--color-gold-glow))",
                WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-glow/20 to-gold-glow/20 shadow-[0_0_18px_-2px_rgba(232,196,104,0.55)]">
              <Icon className="h-5 w-5 text-gold-glow" aria-hidden />
            </div>

            <div className="relative min-w-0 flex-1">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-emerald-glow">
                Logro desbloqueado
              </p>
              <p className="mt-0.5 font-display text-sm leading-snug text-parchment">
                {achievement.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-parchment-muted">
                {achievement.description}
              </p>
            </div>

            <button
              type="button"
              onClick={dismissToast}
              aria-label="Cerrar notificación de logro"
              className="relative shrink-0 rounded-md px-1.5 py-1 text-xs text-parchment-muted/70 transition-colors duration-150 hover:text-parchment"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
