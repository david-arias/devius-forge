import { AchievementSchema, type Achievement } from "../schemas";

/**
 * Definiciones de Achievements (Deméter, Iteración 10). Ver el comentario
 * en `schemas/achievement.ts` sobre por qué esto NO sigue el patrón de
 * repositorio async (`fetchXFromSource` + `getX`) del resto de `queries/`:
 * son ids que el código de Hefesto/Minerva referencia directamente en los
 * triggers (scroll al Footer, click en un CTA), así que viven como
 * constante sincrónica en vez de "contenido" fetcheable. Se valida igual
 * con `AchievementSchema.array().parse(...)` al importar el módulo, para
 * detectar un typo de forma en build-time y no en runtime del navegador.
 *
 * Agregar un logro nuevo: sumar un objeto acá + un trigger real en algún
 * componente de Hefesto que llame a `useAchievementsStore.getState().unlock(id)`
 * (ver `src/lib/minerva/achievements-store.ts`) — y agregar su ícono a
 * `src/lib/hefesto/achievement-icons.ts` si es uno nuevo, o el Toast/Drawer
 * lo van a mostrar con el ícono `Trophy` de fallback.
 */
export const ACHIEVEMENTS: Achievement[] = AchievementSchema.array().parse([
  {
    id: "forge-explorer",
    title: "Explorador de la Forja",
    description: "Recorriste el portafolio completo, de punta a punta.",
    icon: "Compass",
  },
  {
    id: "call-to-adventure",
    title: "Llamado a la Aventura",
    description: "Diste el primer paso para iniciar una Quest juntos.",
    icon: "Swords",
  },
  // ── Iteración 13 — expansión de gamificación ──────────────────────────
  {
    id: "blacksmith-curiosity",
    title: "Curiosidad de Herrero",
    description: "Abriste la Bitácora de Logros por primera vez.",
    icon: "Hammer",
  },
  {
    id: "ui-scholar",
    title: "Erudito de la UI",
    description: "Te quedaste más de 15 segundos leyendo un caso de estudio completo.",
    icon: "BookOpen",
  },
  {
    id: "weapon-inspection",
    title: "Inspección de Armamento",
    description: "Revisaste de cerca un arma del Inventario.",
    icon: "Eye",
  },
  {
    id: "contact-established",
    title: "Contacto Establecido",
    description: "Copiaste el correo o abriste el LinkedIn de Devius.",
    icon: "Handshake",
  },
  // ── Iteración 26 — secreto de la Forja (Código Konami) ────────────────
  {
    id: "ancient-knowledge",
    title: "Conocimiento Ancestral",
    description: "Invocaste la secuencia prohibida de los viejos maestros. ↑↑↓↓←→←→BA",
    icon: "KeyRound",
    secret: true,
  },
]);

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}
