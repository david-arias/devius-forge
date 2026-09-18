"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AudioPreferenceState {
  /**
   * `true` = SFX silenciados. Arranca en `true` (silenciado) por defecto
   * — mismo criterio "nunca sonido sin una acción explícita del
   * visitante" que ya documentaba `use-audio.ts` antes de que existiera
   * un control real en la UI. Persistido (`localStorage`) para que la
   * preferencia sobreviva a un reload, igual que `achievements-store.ts`.
   */
  muted: boolean;
  toggleMuted: () => void;
  setMuted: (muted: boolean) => void;
}

/**
 * Preferencia de audio — Minerva, Iteración 29. Cierra el pendiente que
 * `use-audio.ts` documenta desde la Iteración 8 ("falta [...] un control
 * de silenciar sonidos en la UI [...] un ícono de altavoz en el Navbar
 * sería el lugar natural") y que `handoff.md` seguía listando en "Roto /
 * pendiente de decisión". La acción "Activar/Desactivar audio" de la
 * Paleta de Comandos (`CommandPalette.tsx`) es ese control — sin sumar
 * un ícono más al Navbar, que ya tiene varios.
 *
 * `useAudio()` (`src/lib/hefesto/use-audio.ts`) consulta `muted` antes de
 * reproducir cualquier SFX. Sigue existiendo `NEXT_PUBLIC_SFX_ENABLED`
 * como interruptor de build — son ejes independientes: uno es "¿existen
 * los assets todavía?", el otro es "¿lo pidió el visitante?".
 */
export const useAudioPreferenceStore = create<AudioPreferenceState>()(
  persist(
    (set) => ({
      muted: true,
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
      setMuted: (muted) => set({ muted }),
    }),
    { name: "devius-audio-preference" }
  )
);
