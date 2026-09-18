"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAchievementById } from "@/lib/demeter/queries/achievements";
import { trackForgeEvent } from "@/lib/minerva/telemetry";

interface AchievementsState {
  /** Ids ya desbloqueados — persistido, sobrevive a un reload/nueva visita. */
  unlockedIds: string[];
  /** Cola de ids pendientes de mostrar como Toast — NUNCA persistida (ver `partialize` abajo). */
  toastQueue: string[];
  /**
   * Estado del Drawer de Logros (Iteración 12) — panel lateral que lista
   * TODOS los logros (desbloqueados y bloqueados), abierto desde un botón
   * nuevo en el Navbar (ver `AchievementsDrawer.tsx`). No persistido a
   * propósito: siempre arranca cerrado en cada visita/reload, igual que
   * cualquier panel/modal de la UI.
   */
  drawerOpen: boolean;
  /**
   * Desbloquea un logro por id. Idempotente: si ya estaba desbloqueado no
   * hace nada (ni vuelve a encolar el Toast) — un visitante que hace
   * scroll al Footer dos veces no debería ver la notificación dos veces.
   */
  unlock: (id: string) => void;
  /** Saca el primer id de la cola de Toasts (llamado por `AchievementToast` al cerrar/expirar). */
  dismissToast: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

/**
 * Store de Logros (Minerva, Iteración 10). Zustand + `persist` (localStorage,
 * key `devius-achievements`) para que los logros desbloqueados sobrevivan a
 * un reload — coherente con la idea de "progreso" de un RPG real. `zustand`
 * ya era una dependencia del proyecto (ver `package.json`), no se agregó
 * nada nuevo.
 *
 * Sólo `unlockedIds` se persiste (`partialize`): `toastQueue` es estado de
 * UI puramente transitorio — si persistiera, un visitante que recarga la
 * página justo después de desbloquear un logro volvería a ver el Toast al
 * abrir la página de nuevo, lo cual se siente como un bug, no como una
 * feature.
 */
export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      unlockedIds: [],
      toastQueue: [],
      drawerOpen: false,
      unlock: (id) => {
        if (get().unlockedIds.includes(id)) return;
        // Ignora ids desconocidos (typo en un trigger) en vez de romper la UI.
        const achievement = getAchievementById(id);
        if (!achievement) return;

        set((state) => ({
          unlockedIds: [...state.unlockedIds, id],
          toastQueue: [...state.toastQueue, id],
        }));
        // Iteración 24: sólo la PRIMERA vez (el guard de arriba ya cortó los repetidos).
        trackForgeEvent("achievement_unlocked", { id, title: achievement.title });
      },
      dismissToast: () => {
        set((state) => ({ toastQueue: state.toastQueue.slice(1) }));
      },
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
    }),
    {
      name: "devius-achievements",
      partialize: (state) => ({ unlockedIds: state.unlockedIds }),
    }
  )
);
