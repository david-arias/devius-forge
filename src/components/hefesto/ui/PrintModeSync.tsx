"use client";

import { useEffect } from "react";
import { usePrintModeStore } from "@/lib/minerva/print-mode-store";

/**
 * PrintModeSync — Minerva, Iteración 30. Puente entre `print-mode-store.ts`
 * (Zustand/localStorage) y el CSS de impresión: escribe `mode` como
 * `data-print-mode` en `<html>` cada vez que cambia. `@media print` en
 * `globals.css` lee ese atributo (`html[data-print-mode="premium"]`) para
 * decidir entre el CV en blanco y negro (Eco) o conservar la estética
 * Dark RPG (Premium, con `print-color-adjust: exact`) — un `@media print`
 * no tiene forma de leer un store de React directamente.
 *
 * No renderiza nada — mismo criterio que `ScrollToHash`/`KonamiSecret`:
 * un componente "efecto puro" montado una vez en `SiteChrome`.
 */
export function PrintModeSync() {
  const mode = usePrintModeStore((state) => state.mode);

  useEffect(() => {
    document.documentElement.dataset.printMode = mode;
  }, [mode]);

  return null;
}
