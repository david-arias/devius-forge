"use client";

import { useCallback, useRef } from "react";
import { useAudioPreferenceStore } from "@/lib/minerva/audio-preference-store";

/**
 * Interruptor global de SFX — Apolo, Iteración 21 (tech debt).
 * Mientras `public/sfx/` no tenga los `.mp3` reales, cada `new Audio(...)`
 * generaba un 404 en la consola de producción. Con `false`, ninguna función
 * de este hook crea un `<audio>` ni hace requests: son no-ops.
 * Para activar: subir los 3 archivos (o generar silencios con
 * `scripts/generate-silent-sfx.sh`) y definir `NEXT_PUBLIC_SFX_ENABLED=true`.
 * Es un flag de build sin valor sensible (por eso lleva prefijo público);
 * en Vercel, si se usa, va como variable de tipo "Config".
 */
const SFX_ENABLED = process.env.NEXT_PUBLIC_SFX_ENABLED === "true";

/**
 * useAudio — Iteración 8 (Hefesto). Hook stub, documentado pero NO
 * conectado a ningún botón todavía ("Opcional pero recomendado" en el
 * pedido de Devius) — queda listo para que cuando existan los assets de
 * sonido reales, integrarlos sea cuestión de 2 líneas por botón.
 *
 * Sonidos previstos para el sistema (ver MASTER.md → "Audio UI"):
 *  - hover: un "whoosh" muy sutil y corto (~80-120ms) al pasar el mouse
 *    sobre los CTAs principales ("Iniciar Quest").
 *  - click: un "clink" metálico de yunque, corto y seco, al confirmar el
 *    click de esos mismos CTAs.
 *
 * Requisitos de accesibilidad/UX antes de activarlo (HADES):
 *  1. Los archivos deben vivir en `/public/sfx/` (p. ej. `hover-whoosh.mp3`
 *     y `click-anvil.mp3`), en formato corto y liviano (<20kb ideal).
 *  2. El audio debe iniciar SIEMPRE muteado por defecto y sólo activarse
 *     tras una interacción explícita del usuario — nunca autoplay al
 *     cargar la página (los navegadores lo bloquean igual, pero además
 *     sería una mala práctica de accesibilidad).
 *  3. Debe respetar una preferencia de "silenciar sonidos" persistida
 *     (localStorage) antes de reproducir nada — resuelto en la Iteración 29:
 *     `audio-preference-store.ts` + la acción "Activar/Desactivar audio"
 *     de la Paleta de Comandos (`CommandPalette.tsx`), consultada más
 *     abajo (`muted`).
 *  4. NO debe interferir con `useReducedMotion()` — son ejes independientes
 *     (una persona puede querer sonido sin movimiento, o viceversa).
 *
 * Uso previsto una vez cableado:
 * ```tsx
 * const { playHover, playClick } = useAudio();
 * <Magnetic>
 *   <a href={ctaHref} onMouseEnter={playHover} onClick={playClick}>
 *     <Button variant="cta">Iniciar Quest</Button>
 *   </a>
 * </Magnetic>
 * ```
 */
export function useAudio() {
  const hoverRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);
  const achievementRef = useRef<HTMLAudioElement | null>(null);
  // Iteración 29 (Minerva): preferencia real de "silenciar audio",
  // controlable desde la Paleta de Comandos (`CommandPalette.tsx`) — ver
  // `audio-preference-store.ts`. Eje independiente de `SFX_ENABLED`
  // (build) y de `useReducedMotion()` (animación), tal como pedía el
  // punto 4 del docblock de arriba.
  const muted = useAudioPreferenceStore((state) => state.muted);

  const playHover = useCallback(() => {
    if (!SFX_ENABLED || muted) return;
    // Lazy-init: el <audio> sólo se crea la primera vez que se necesita,
    // nunca al montar el árbol (evita peticiones de red innecesarias en
    // cada carga de página mientras el asset no exista/esté silenciado).
    if (!hoverRef.current) {
      hoverRef.current = new Audio("/sfx/hover-whoosh.mp3");
      hoverRef.current.volume = 0.25;
    }
    void hoverRef.current.play().catch(() => {
      // Reproducción bloqueada por el navegador (falta interacción previa)
      // o asset inexistente todavía — falla en silencio a propósito, este
      // sonido es un extra decorativo, nunca debe romper la interacción.
    });
  }, [muted]);

  const playClick = useCallback(() => {
    if (!SFX_ENABLED || muted) return;
    if (!clickRef.current) {
      clickRef.current = new Audio("/sfx/click-anvil.mp3");
      clickRef.current.volume = 0.35;
    }
    void clickRef.current.play().catch(() => {});
  }, [muted]);

  /**
   * playAchievement — sonido opcional del Toast de Logro (Iteración 10,
   * MASTER.md → "Sistema de Logros"). Mismo patrón lazy-init + fail-silent
   * que `playHover`/`playClick`: si `/sfx/achievement-unlock.mp3` todavía
   * no existe en `/public/sfx/`, el Toast se sigue viendo perfecto, sólo
   * queda mudo. `AchievementToast` ya lo llama — no hace falta cablear
   * nada más cuando el asset real esté listo.
   */
  const playAchievement = useCallback(() => {
    if (!SFX_ENABLED || muted) return;
    if (!achievementRef.current) {
      achievementRef.current = new Audio("/sfx/achievement-unlock.mp3");
      achievementRef.current.volume = 0.4;
    }
    void achievementRef.current.play().catch(() => {});
  }, [muted]);

  return { playHover, playClick, playAchievement };
}
