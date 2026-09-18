"use client";

import { create } from "zustand";

interface CommandPaletteState {
  open: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

/**
 * Store del estado abierto/cerrado de la Paleta de Comandos (Cmd+K) —
 * Minerva, Iteración 29 ("El Toque del Maestro"). Mismo patrón que
 * `achievements-store.ts` → `drawerOpen`: un Zustand mínimo, SIN
 * `persist` (un modal siempre debe arrancar cerrado en cada carga/visita,
 * nunca recordar que quedó abierto). Vive en un store separado — no en
 * `achievements-store.ts` — porque no tiene ninguna relación de dominio
 * con los logros, sólo comparte la mecánica de "panel global abierto por
 * un trigger en el Navbar + cerrado desde cualquier otro lugar".
 *
 * Por qué un store y no `useState` local en `CommandPalette.tsx`: el
 * trigger (`CommandPaletteTrigger`, un botón en `Navbar`, Server
 * Component) y el panel (`CommandPalette`, montado en `SiteChrome`) son
 * dos árboles de React distintos — igual que `AchievementsDrawerTrigger`
 * y `AchievementsDrawer` con `achievements-store.ts`.
 */
export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  open: false,
  openPalette: () => set({ open: true }),
  closePalette: () => set({ open: false }),
  togglePalette: () => set((state) => ({ open: !state.open })),
}));
