"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Backpack, Inbox, LayoutDashboard, LogOut, Menu, Network, ScrollText, Settings, Swords, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useDialogPanel } from "@/lib/hefesto/use-dialog-panel";
import { getSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/admin/character", label: "Character Sheet", icon: ScrollText },
  { href: "/admin/skills", label: "Skill Tree", icon: Network },
  { href: "/admin/inventory", label: "Inventario", icon: Backpack },
  { href: "/admin/quests", label: "Quests", icon: Swords },
  // Iteración 22 — separadas visualmente del contenido del portafolio.
  { href: "/admin/messages", label: "Buzón", icon: Inbox, group: "sistema" },
  { href: "/admin/analytics", label: "Telemetría", icon: Activity, group: "sistema" },
  { href: "/admin/settings", label: "Ajustes", icon: Settings, group: "sistema" },
] as const;

/**
 * AdminSidebar — Hefesto, Iteración 14 ("La Forja Oculta"). Shell del
 * panel `/admin`: navegación por entidad + logout. Mismo lenguaje visual
 * que el resto del sitio (obsidiana/carbón, acentos esmeralda/dorado,
 * `font-display` para el título) — un reclutador que entrara acá por
 * error no debería notar que cambió de "app".
 *
 * Responsive: en desktop (`sm:` en adelante) es una barra lateral fija.
 * En mobile colapsa a una barra superior con un trigger de menú que abre
 * un drawer — mismo patrón de accesibilidad que `MobileMenu.tsx`
 * (`useDialogPanel`: focus trap, cierre con Escape + restauración de foco,
 * scroll-lock del body).
 *
 * El logout llama `supabase.auth.signOut()` y redirige a `/admin/login`
 * con `router.refresh()` para que `proxy.ts` vuelva a evaluar la
 * sesión (ya inexistente) en la siguiente navegación.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelId = useId();
  const panelRef = useDialogPanel<HTMLDivElement>(mobileOpen, () => setMobileOpen(false));

  async function handleLogout() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push("/admin/login");
    router.refresh();
  }

  const navList = (onNavigate?: () => void) => (
    <nav aria-label="Secciones del panel" className="flex flex-1 flex-col gap-1">
      {ADMIN_LINKS.map((link, index) => {
        const { href, label, icon: Icon } = link;
        const exact = "exact" in link && link.exact;
        const active = pathname === href || (!exact && pathname?.startsWith(`${href}/`));
        const startsGroup = "group" in link && !("group" in (ADMIN_LINKS[index - 1] ?? {}));
        return (
          <div key={href}>
          {startsGroup && (
            <p className="mb-1 mt-5 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-parchment-muted/60">
              Sistema
            </p>
          )}
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150",
              active
                ? "bg-emerald-glow/10 text-emerald-glow shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]"
                : "text-parchment-muted hover:bg-carbon-elevated hover:text-parchment"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Barra superior mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-obsidian-soft/95 px-4 py-3 backdrop-blur-sm sm:hidden">
        <span className="font-display text-sm text-parchment">La Forja Oculta</span>
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls={panelId}
          aria-label={mobileOpen ? "Cerrar menú de administración" : "Abrir menú de administración"}
          onClick={() => setMobileOpen((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-parchment transition-colors duration-150 hover:bg-carbon-elevated"
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              aria-hidden
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
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
              aria-label="Menú de administración"
              className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col gap-6 border-r border-white/10 bg-obsidian-soft p-6 pt-8 sm:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <span className="font-display text-lg text-parchment">La Forja Oculta</span>
              {navList(() => setMobileOpen(false))}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-auto flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-parchment-muted transition-colors duration-150 hover:bg-carbon-elevated hover:text-parchment"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Cerrar sesión
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar fija desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-white/10 bg-obsidian-soft/60 p-6 sm:flex">
        <span className="font-display text-lg text-parchment">La Forja Oculta</span>
        {navList()}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-parchment-muted transition-colors duration-150 hover:bg-carbon-elevated hover:text-parchment"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Cerrar sesión
        </button>
      </aside>
    </>
  );
}
