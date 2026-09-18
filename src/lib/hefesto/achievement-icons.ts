import {
  BookOpen,
  Compass,
  Eye,
  Handshake,
  Hammer,
  KeyRound,
  Sparkles,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/**
 * Mapa ícono → componente para los Logros (Hefesto, Iteración 13).
 *
 * Extraído a un único archivo compartido: hasta la Iteración 12,
 * `AchievementToast` y `AchievementsDrawer` tenían cada uno su propia copia
 * de este mapa — al sumar 4 logros nuevos acá quedó claro que era cuestión
 * de tiempo olvidar actualizar una de las dos copias y que un logro nuevo
 * apareciera con el ícono `Trophy` de fallback en un lugar sí y en el otro
 * no. Deméter guarda el ícono como string (no conoce React); esta es la
 * única resolución string → componente de todo el sitio.
 */
export const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Compass,
  Swords,
  Sparkles,
  Hammer,
  BookOpen,
  Eye,
  Handshake,
  KeyRound,
};

/** Ícono de fallback si `AchievementSchema.icon` trae un nombre que no está mapeado acá (typo). */
export const ACHIEVEMENT_ICON_FALLBACK: LucideIcon = Trophy;
