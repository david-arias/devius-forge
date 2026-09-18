"use client";

import { useCallback, useRef } from "react";

/**
 * Interruptor global de SFX — Apolo, Iteración 21 (tech debt).
 * Mientras `public/sfx/` no tenga los `.mp3` reales, cada `new Audio(...)`
 * generaba un 404 en la consola de producción. Con `false`, ninguna función
 * de este hook crea un `<audio>` ni hace requests: son no-ops.
 * Para activar: subir los 3 archivos (o generar silencios con
 * `scripts/generate-silent-sfx.sh`) y pasar esto a `true` o definir
 * `NEXT_PUBLIC_SFX_ENABLED=true`.
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
 *     (localStorage) antes de reproducir nada — todavía no existe ese
 *     control en la UI, hay que diseñarlo (un ícono de altavoz en el
 *     Navbar sería el lugar natural) antes de cablear esto a un botón real.
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

  const playHover = useCallback(() => {
    if (!SFX_ENABLED) return;
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
  }, []);

  const playClick = useCallback(() => {
    if (!SFX_ENABLED) return;
    if (!clickRef.current) {
      clickRef.current = new Audio("/sfx/click-anvil.mp3");
      clickRef.current.volume = 0.35;
    }
    void clickRef.current.play().catch(() => {});
  }, []);

  /**
   * playAchievement — sonido opcional del Toast de Logro (Iteración 10,
   * MASTER.md → "Sistema de Logros"). Mismo patrón lazy-init + fail-silent
   * que `playHover`/`playClick`: si `/sfx/achievement-unlock.mp3` todavía
   * no existe en `/public/sfx/`, el Toast se sigue viendo perfecto, sólo
   * queda mudo. `AchievementToast` ya lo llama — no hace falta cablear
   * nada más cuando el asset real esté listo.
   */
  const playAchievement = useCallback(() => {
    if (!SFX_ENABLED) return;
    if (!achievementRef.current) {
      achievementRef.current = new Audio("/sfx/achievement-unlock.mp3");
      achievementRef.current.volume = 0.4;
    }
    void achievementRef.current.play().catch(() => {});
  }, []);

  return { playHover, playClick, playAchievement };
}
