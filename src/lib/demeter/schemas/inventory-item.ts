import { z } from "zod";

/** InventoryItem = tecnología del stack. Dominio Deméter. */
export const InventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["frontend", "backend", "design", "devops", "tools", "animation"]),
  rarity: z.enum(["common", "rare", "legendary"]).default("common"),
  /** Nivel de dominio (0-100) — alimenta los anillos de progreso del Inventario. */
  level: z.number().min(0).max(100),
  /**
   * Visibilidad pública — Iteración 16 ("CMS V2"), mismo concepto que
   * `SkillNode.unlocked` (Skill Tree) y `Quest.isPublished` (Quests):
   * `false` = borrador, oculto del Inventario público. `.default(true)`
   * por la misma razón que en `quest.ts` (columna nueva / fallback estático).
   */
  isPublished: z.boolean().default(true),
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;
