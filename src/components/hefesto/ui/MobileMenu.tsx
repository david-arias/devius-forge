"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Trophy, X } from "lucide-react";
import { useId, useState } from "react";
import { type Navigation } from "@/lib/demeter/schemas";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";
import { useDialogPanel } from "@/lib/hefesto/use-dialog-panel";
import { Button } from "./Button";

interface MobileMenuProps {
  navigation: Navigation;
}

/**
 * MobileMenu — Hefesto (auditoría 2026-09-15, hallazgo de Alto Impacto).
 * El Navbar ocultaba `navLinks` bajo `sm:flex` sin ningún reemplazo en
 * mobile: un visitante en celular no podía llegar a Quests/Skill
 * Tree/Inventario sin scrollear a mano. Este drawer sólo se monta en
 * `<sm` (el `<nav>` de desktop sigue siendo estático, sin JS) y repite las
 * mismas anclas + enlaces sociales del Navbar/Footer.
 *
 * Accesibilidad (HADES) — delegada a `useDialogPanel` (Iteración 12, ver
 * `src/lib/hefesto/use-dialog-panel.ts`): focus trap, cierre con Escape +
 * restauración de foco, foco inicial en el panel, y bloqueo de scroll del
 * body mientras está abierto. `aria-expanded`/`aria-controls` en el
 * trigger, `role="dialog"` + `aria-modal` + `aria-label` en el panel.
 */
export function MobileMenu({ navigation }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useDialogPanel<HTMLDivElement>(open, () => setOpen(false));
  const unlock = useAchievementsStore((state) => state.unlock);
  const openAchievementsDrawer = useAchievementsStore((state) => state.openDrawer);

  const emailLink = navigation.socialLinks.find((link) => link.kind === "email");

  function closeAndNavigate() {
    setOpen(false);
  }

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-parchment transition-colors duration-150 hover:bg-carbon-elevated"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              aria-hidden
              onClick={() => setOpen(false)}
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
              aria-label="Menú de navegación"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col gap-8 border-l border-white/10 bg-obsidian-soft p-6 pt-20"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <nav aria-label="Secciones" className="flex flex-col gap-1">
                {navigation.navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeAndNavigate}
                    className="rounded-md px-3 py-3 font-display text-lg text-parchment transition-colors duration-150 hover:bg-carbon-elevated"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
                {navigation.socialLinks
                  .filter((link) => link.kind !== "email")
                  .map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={closeAndNavigate}
                      className="px-3 text-sm text-parchment-muted transition-colors duration-150 hover:text-parchment"
                    >
                      {link.label}
                    </a>
                  ))}

                {/* Trigger del Drawer de Logros — en desktop vive en el Navbar (`AchievementsDrawerTrigger`, oculto bajo `sm:`), acá es su equivalente mobile (Iteración 12). */}
                <button
                  type="button"
                  onClick={() => {
                    closeAndNavigate();
                    openAchievementsDrawer();
                  }}
                  className="inline-flex items-center gap-2 px-3 text-sm text-parchment-muted transition-colors duration-150 hover:text-parchment"
                >
                  <Trophy className="h-4 w-4" aria-hidden />
                  Ver logros
                </button>
              </div>

              {emailLink && (
                <a
                  href={emailLink.href}
                  onClick={() => {
                    unlock("call-to-adventure");
                    closeAndNavigate();
                  }}
                  className="mt-auto"
                >
                  <Button variant="cta" className="w-full">
                    Iniciar Quest
                  </Button>
                </a>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
