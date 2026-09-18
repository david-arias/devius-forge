import { z } from "zod";

/**
 * Achievement = "Logro" desbloqueable de la gamificación RPG (Iteración 10,
 * MINERVA/HEFESTO). Dominio Deméter — mismo criterio que el resto de
 * entidades: forma validada con Zod, consumida por Minerva y Hefesto.
 *
 * A diferencia de Quest/SkillNode/InventoryItem, las definiciones de
 * Achievement NO pasan por el patrón de repositorio de `queries/` (ver
 * `queries/achievements.ts`): no son contenido editorial que vaya a vivir
 * en un CMS, son configuración de producto acoplada a los triggers de la
 * UI (ids que el código referencia directamente). Se documentan igual acá
 * porque cualquier dato con forma propia es responsabilidad de Deméter.
 */
export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  /** Nombre de ícono de `lucide-react` (se resuelve en Hefesto, no acá — Deméter no conoce React). */
  icon: z.string(),
  /**
   * Logro oculto (Iteración 26): el Drawer no revela título ni descripción
   * hasta desbloquearlo — sólo una silueta con "???".
   */
  secret: z.boolean().default(false),
});

export type Achievement = z.infer<typeof AchievementSchema>;
