"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
import { cn } from "@/lib/utils";

/**
 * AdminToastHost — Hefesto, Iteración 15. Un único host global para los
 * Toasts del panel admin (`useAdminToastStore`, Minerva), montado una
 * vez en `src/app/admin/(protected)/layout.tsx` — mismo criterio que
 * `AchievementToast`/`AchievementsDrawer` en el layout público
 * (`src/app/layout.tsx`): un solo listener, cualquier formulario del CMS
 * puede empujar un toast sin renderizar su propio host.
 *
 * `aria-live="polite"` en el contenedor: un lector de pantalla anuncia
 * "Quest guardada"/"No se pudo guardar…" apenas aparece, sin robarle el
 * foco al usuario (que sigue en el formulario).
 */
export function AdminToastHost() {
  const toasts = useAdminToastStore((state) => state.toasts);
  const dismiss = useAdminToastStore((state) => state.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-2xl backdrop-blur-md",
              toast.type === "success"
                ? "border-emerald-glow/40 bg-obsidian-soft/95 text-parchment"
                : "border-danger/50 bg-obsidian-soft/95 text-parchment"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-glow" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Cerrar notificación"
              className="shrink-0 text-parchment-muted transition-colors duration-150 hover:text-parchment"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
