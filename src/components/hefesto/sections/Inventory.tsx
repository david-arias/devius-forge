"use client";

import { motion } from "framer-motion";
import { type InventoryItem } from "@/lib/demeter/schemas";
import { Backpack } from "lucide-react";
import { EmptyState, LevelRing, SectionHeading, StaggerReveal, TiltCard } from "@/components/hefesto/ui";
import { fadeInUp } from "@/lib/hefesto/motion";
import { useAchievementsStore } from "@/lib/minerva/achievements-store";

interface InventoryProps {
  items: InventoryItem[];
}

/**
 * Agrupación temática del Inventario (presentación, dominio de Hefesto).
 * `category` en Deméter es neutral a propósito — este mapeo (etiqueta +
 * color del anillo) es sólo cómo Hefesto decide mostrarlo con sabor Dark RPG.
 */
const GROUP_META: Partial<Record<InventoryItem["category"], { label: string; order: number; color: string }>> = {
  frontend: { label: "Armas Principales", order: 0, color: "#34d399" },
  design: { label: "Artefactos de Diseño", order: 1, color: "#e8c468" },
  animation: { label: "Magia / Animación", order: 2, color: "#7dd3fc" },
  backend: { label: "Artefactos de Backend", order: 3, color: "#a8a5b0" },
  devops: { label: "Herramientas de Campamento", order: 4, color: "#a8a5b0" },
  tools: { label: "Herramientas", order: 5, color: "#a8a5b0" },
};

function groupItems(items: InventoryItem[]) {
  const groups = new Map<InventoryItem["category"], InventoryItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.category) ?? [];
    bucket.push(item);
    groups.set(item.category, bucket);
  }
  return Array.from(groups.entries()).sort(
    ([a], [b]) => (GROUP_META[a]?.order ?? 99) - (GROUP_META[b]?.order ?? 99)
  );
}

/**
 * Inventory = Tecnologías/Items, como menú de estado de videojuego.
 * Sección de Hefesto — recibe datos por props (vía Minerva). Apolo: paso #5
 * del flujo narrativo — cierra la página con "de qué está hecho" Devius.
 * Reemplaza las píldoras de texto por `LevelRing` (anillo de progreso SVG).
 */
export function Inventory({ items }: InventoryProps) {
  const groups = groupItems(items);
  const unlock = useAchievementsStore((state) => state.unlock);
  const unlockWeaponInspection = () => unlock("weapon-inspection");

  return (
    <section id="inventario" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-8 sm:py-28">
      <SectionHeading index="05" eyebrow="Equipo" title="Inventario" />
      {items.length === 0 && (
        <EmptyState
          icon={Backpack}
          title="El inventario está vacío"
          description="Las armas y artefactos de esta forja todavía se están catalogando."
        />
      )}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {groups.map(([category, categoryItems]) => {
          const meta = GROUP_META[category];
          return (
            <div key={category}>
              <p className="mb-5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-glow/80">
                {meta?.label ?? category}
              </p>
              <StaggerReveal className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-2">
                {categoryItems.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={fadeInUp}
                    // Logro "Inspección de Armamento" (Iteración 13) — hover
                    // o click alcanza. A propósito NO se usa `onFocus`: el
                    // anillo no es un elemento interactivo real (no es link
                    // ni botón), así que agregarle `tabIndex` sólo para
                    // captar foco de teclado crearía una parada vacía en el
                    // orden de tabulación — peor accesibilidad, no mejor.
                    // `unlock` es idempotente, no hace falta desuscribirse.
                    onMouseEnter={unlockWeaponInspection}
                    onClick={unlockWeaponInspection}
                  >
                    {/* Iteración 21: cada ítem es un objeto físico — tilt 3D + brillo que sigue al cursor. */}
                    <TiltCard
                      glareColor={`color-mix(in srgb, ${meta?.color ?? "#e8c468"} 28%, transparent)`}
                      className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] px-2 pb-4 pt-5 transition-colors duration-300 hover:border-white/20"
                    >
                      <div style={{ transform: "translateZ(28px)" }}>
                        <LevelRing label={item.name} level={item.level} color={meta?.color ?? "#e8c468"} />
                      </div>
                    </TiltCard>
                  </motion.div>
                ))}
              </StaggerReveal>
            </div>
          );
        })}
      </div>
    </section>
  );
}
