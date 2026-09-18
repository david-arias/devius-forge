"use client";

import { create } from "zustand";

export interface AdminToast {
  id: string;
  type: "success" | "error";
  message: string;
}

interface AdminToastState {
  toasts: AdminToast[];
  push: (type: AdminToast["type"], message: string) => void;
  dismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 4500;

/**
 * Store de Toasts del panel admin (Minerva, Iteración 15 — auditoría
 * 2026-09-15: "no hay ningún mensaje de error o confirmación visible
 * tras guardar"). Zustand SIN `persist` a propósito, a diferencia de
 * `achievements-store.ts` — un toast de "Quest guardada" no debería
 * sobrevivir a un reload ni compartirse entre pestañas, es feedback
 * 100% efímero de la acción que se acaba de hacer.
 *
 * Un solo store para los 4 formularios del CMS (Quest/Skills/Inventory/
 * Character) en vez de un `useState` local por formulario: `EntityActionsMenu`
 * y los `useActionState` de `src/lib/minerva/actions/*.ts` vivven en
 * componentes/servers distintos y necesitan un mismo canal para avisarle
 * al usuario "esto pasó", sin importar qué formulario disparó la acción.
 */
export const useAdminToastStore = create<AdminToastState>((set) => ({
  toasts: [],
  push: (type, message) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, AUTO_DISMISS_MS);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
