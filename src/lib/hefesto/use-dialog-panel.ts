"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * useDialogPanel — Hefesto (Iteración 12). Extraído de `MobileMenu.tsx`
 * (Iteración 9) para reutilizar la misma mecánica de accesibilidad en
 * `AchievementsDrawer.tsx` sin duplicar el focus trap a mano una segunda
 * vez. Cualquier panel off-canvas nuevo del sitio (drawer, sheet) debería
 * pasar por acá en vez de reimplementar esto de cero.
 *
 * Qué resuelve (HADES):
 *  - Bloquea el scroll del body mientras `open` es `true`.
 *  - Focus trap manual: Tab/Shift+Tab ciclan sólo entre los elementos
 *    enfocables DENTRO del panel.
 *  - `Escape` cierra (vía `onClose`) y devuelve el foco al elemento que
 *    tenía el foco antes de abrir el panel (normalmente el botón trigger)
 *    — más robusto que exigirle a cada caller pasar su propio `triggerRef`.
 *  - Mueve el foco al primer elemento enfocable del panel al abrir.
 *
 * Uso:
 * ```tsx
 * const panelRef = useDialogPanel(open, () => setOpen(false));
 * <div ref={panelRef} role="dialog" aria-modal="true">...</div>
 * ```
 */
export function useDialogPanel<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const panelRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Bloqueo de scroll del body mientras el panel está abierto.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Focus trap + cierre con Escape + foco inicial/restaurado.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    focusables[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        previouslyFocusedRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `onClose` se re-crea en cada render de los callers actuales (closures inline); re-suscribir el listener por eso es innecesario y reabrir/cerrar no depende de su identidad.
  }, [open]);

  return panelRef;
}
