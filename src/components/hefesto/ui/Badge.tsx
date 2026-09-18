import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Rarity = "common" | "rare" | "legendary";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  rarity?: Rarity;
}

const rarityClasses: Record<Rarity, string> = {
  common: "text-parchment-muted border-white/10",
  rare: "text-neon border-neon/30 shadow-[0_0_10px_-4px_rgba(125,211,252,0.55)]",
  legendary: "text-gold-glow border-gold-deep/70 shadow-[0_0_12px_-4px_rgba(232,196,104,0.55)]",
};

/**
 * Badge — "ítem de inventario" (Hefesto). Ver MASTER.md.
 * Píldora translúcida para tecnologías (Inventario) y stack/tags de Quest.
 * `rarity="common"` (default) es el estilo neutro: borde sutil `white/10`
 * sobre fondo oscuro translúcido — pensado para tags de Quest ("Loot").
 */
export function Badge({ className, rarity = "common", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border bg-obsidian/50 px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition-shadow duration-200",
        rarityClasses[rarity],
        className
      )}
      {...props}
    />
  );
}
