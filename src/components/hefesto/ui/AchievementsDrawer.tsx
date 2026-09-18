"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Lock, X } from "lucide-react";
import { useEffect, useId } from "react";
import { ACHIEVEMENTS } from "@/lib/demeter/queries/achievements";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";
import { useDialogPanel } from "@/lib/hefesto/use-dialog-panel";
import { ACHIEVEMENT_ICON_FALLBACK, ACHIEVEMENT_ICONS } from "@/lib/hefesto/achievement-icons";
import { cn } from "@/lib/utils";

/**
 * AchievementsDrawer — Hefesto (Iteración 12). Panel lateral derecho, "menú
 * de pausa de RPG": lista TODOS los logros del juego, desbloqueados
 * (glow esmeralda/dorado + check) y bloqueados (silueta gris + candado,
 * pero con título/descripción visibles — a diferencia de un juego real, acá
 * conviene que el visitante sepa CÓMO desbloquearlo, no ocultárselo).
 * Se abre desde un botón nuevo en el Navbar (ícono `Trophy`).
 *
 * Reutiliza `useDialogPanel` (mismo hook que `MobileMenu`, ver Iteración
 * 12) para focus trap/Escape/scroll-lock — cero código de accesibilidad
 * duplicado entre los dos paneles off-canvas del sitio.
 */
export function AchievementsDrawer() {
  const open = useAchievementsStore((state) => state.drawerOpen);
  const closeDrawer = useAchievementsStore((state) => state.closeDrawer);
  const unlockedIds = useAchievementsStore((state) => state.unlockedIds);
  const unlock = useAchievementsStore((state) => state.unlock);
  const panelId = useId();
  const panelRef = useDialogPanel<HTMLDivElement>(open, closeDrawer);

  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;

  // Logro "Curiosidad de Herrero" (Iteración 13) — abrir este mismo panel
  // por primera vez ya es la acción a premiar, sin importar desde dónde se
  // haya abierto (Navbar en desktop, "Ver logros" en el menú móvil).
  useEffect(() => {
    if (open) unlock("blacksmith-curiosity");
  }, [open, unlock]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            aria-hidden
            onClick={closeDrawer}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Logros desbloqueados"
            className="fixed inset-y-0 right-0 z-50 flex w-[min(24rem,90vw)] flex-col border-l border-white/10 bg-obsidian-soft"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5 pt-20">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-emerald-glow">
                  Bitácora de Logros
                </p>
                <p className="mt-1 font-display text-lg text-parchment">
                  {unlockedCount} / {totalCount} desbloqueados
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Cerrar logros"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-parchment-muted transition-colors duration-150 hover:bg-carbon-elevated hover:text-parchment"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <ul className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-6">
              {ACHIEVEMENTS.map((achievement) => {
                const unlocked = unlockedIds.includes(achievement.id);
                // Iteración 26: un logro `secret` no revela qué es hasta desbloquearlo.
                const hidden = achievement.secret && !unlocked;
                const Icon = hidden
                  ? ACHIEVEMENT_ICON_FALLBACK
                  : (ACHIEVEMENT_ICONS[achievement.icon] ?? ACHIEVEMENT_ICON_FALLBACK);

                return (
                  <li
                    key={achievement.id}
                    className={cn(
                      "relative flex items-start gap-3 overflow-hidden rounded-xl border p-4 transition-colors duration-200",
                      unlocked
                        ? "border-gold-glow/30 bg-white/[0.03]"
                        : "border-white/10 bg-white/[0.015] opacity-60"
                    )}
                  >
                    {unlocked && (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-60"
                        style={{
                          padding: 1,
                          background: "linear-gradient(135deg, var(--color-emerald-glow), var(--color-gold-glow))",
                          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                          WebkitMaskComposite: "xor",
                          maskComposite: "exclude",
                        }}
                      />
                    )}

                    <div
                      className={cn(
                        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        unlocked
                          ? "bg-gradient-to-br from-emerald-glow/20 to-gold-glow/20 shadow-[0_0_18px_-4px_rgba(232,196,104,0.5)]"
                          : "bg-white/5"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", unlocked ? "text-gold-glow" : "text-parchment-muted/50")} aria-hidden />
                    </div>

                    <div className="relative min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-display text-sm leading-snug",
                          unlocked ? "text-parchment" : "text-parchment-muted"
                        )}
                      >
                        {hidden ? "Logro secreto" : achievement.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-parchment-muted/80">
                        {hidden
                          ? "??? — hay un truco escondido en esta forja. Los viejos jugadores lo conocen de memoria."
                          : achievement.description}
                      </p>
                    </div>

                    <span className="relative mt-0.5 shrink-0" aria-hidden>
                      {unlocked ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-glow" />
                      ) : (
                        <Lock className="h-4 w-4 text-parchment-muted/50" />
                      )}
                    </span>
                    <span className="sr-only">{unlocked ? "Desbloqueado" : "Bloqueado"}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
