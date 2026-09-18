"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PrintMode = "eco" | "premium";

interface PrintModeState {
  /**
   * `"eco"` (por defecto) = texto negro sobre blanco puro, pensado para
   * imprimir en papel de verdad sin gastar tinta (el CV "a prueba de
   * balas" de la Iteración 29). `"premium"` = conserva la estética Dark
   * RPG (obsidiana/esmeralda/dorado) al exportar a PDF — pensado para
   * compartir un PDF digital, nunca para imprimir en papel.
   */
  mode: PrintMode;
  setMode: (mode: PrintMode) => void;
  toggleMode: () => void;
}

/**
 * Preferencia de modo de impresión — Minerva/Hades, Iteración 30. Igual
 * que `audio-preference-store.ts`: persistida en `localStorage` para que
 * sobreviva a un reload. `PrintModeSync.tsx` (montado en `SiteChrome`)
 * es el único lugar que LEE este store para efectos secundarios: escribe
 * `mode` como `data-print-mode` en `<html>`, que es lo que `globals.css`
 * lee dentro de `@media print` (ver ese docblock) — un `@media print` no
 * puede leer Zustand directamente, así que el puente es un atributo DOM.
 */
export const usePrintModeStore = create<PrintModeState>()(
  persist(
    (set) => ({
      mode: "eco",
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => ({ mode: state.mode === "eco" ? "premium" : "eco" })),
    }),
    { name: "devius-print-mode" }
  )
);
