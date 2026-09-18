"use client";

import { useEffect, useRef } from "react";

/** Secuencia clásica: ↑ ↑ ↓ ↓ ← → ← → B A. */
export const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

interface KonamiOptions {
  /** Se resetea la secuencia si pasa este tiempo entre teclas (ms). */
  timeoutMs?: number;
  /** `false` desactiva el listener (p. ej. dentro del panel admin). */
  enabled?: boolean;
}

/**
 * useKonamiCode — Minerva, Iteración 26 ("El Secreto de la Forja").
 *
 * Escucha la secuencia a nivel `window` y llama `onUnlock()` al completarla.
 * Detalles que importan:
 *  - Comparación case-insensitive para B/A (`event.key` respeta Shift y
 *    mayúsculas) y por `event.key`, no `keyCode` (deprecado).
 *  - Ignora las pulsaciones mientras el foco está en un input/textarea/
 *    select o en un elemento `contenteditable`: escribir "ba" en el
 *    formulario de contacto no debe disparar el secreto.
 *  - Tolerante al error humano: una tecla equivocada no descarta todo el
 *    progreso, reinicia desde esa tecla si coincide con el primer paso
 *    (permite ↑ ↑ ↑ ↓ ↓ …).
 *  - `onUnlock` se guarda en un ref: el efecto se suscribe UNA vez y no se
 *    re-suscribe en cada render por una función inline del componente.
 *  - No hace `preventDefault`: el scroll con flechas del visitante sigue
 *    funcionando igual.
 */
export function useKonamiCode(onUnlock: () => void, { timeoutMs = 3000, enabled = true }: KonamiOptions = {}) {
  const callbackRef = useRef(onUnlock);
  useEffect(() => {
    callbackRef.current = onUnlock;
  }, [onUnlock]);

  useEffect(() => {
    if (!enabled) return;

    let index = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const isTypingTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el || !el.tagName) return false;
      return (
        ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable === true
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const expected = KONAMI_SEQUENCE[index];

      if (key === expected) {
        index += 1;
      } else {
        index = key === KONAMI_SEQUENCE[0] ? 1 : 0;
      }

      clearTimeout(timer);
      if (index > 0) timer = setTimeout(() => (index = 0), timeoutMs);

      if (index === KONAMI_SEQUENCE.length) {
        index = 0;
        clearTimeout(timer);
        callbackRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, timeoutMs]);
}
