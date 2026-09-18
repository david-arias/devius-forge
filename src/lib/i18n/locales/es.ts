/**
 * Diccionario ES — Minerva, Iteración 31 ("Expansión Global"). Textos
 * ESTÁTICOS de la UI (los que Hefesto escribe en el JSX, no los que
 * vienen de Supabase — esos los traduce Deméter, ver `_en` en
 * `009_i18n.sql`). Se consume con `useTranslation()`
 * (`lib/i18n/use-translation.ts`), nunca importando este archivo directo
 * desde un componente — así el día que se agregue un tercer idioma sólo
 * hace falta un archivo nuevo + una entrada en `dictionaries`.
 *
 * Alcance de esta Iteración (documentado también en `handoff.md`): cubre
 * el toggle de idioma, la Command Palette, y el Footer/EmptyState como
 * ejemplos "insignia" — el resto de la copy estática del sitio (Hero,
 * CharacterSheet, SkillTree, Inventory, etc.) sigue hardcodeada en
 * español directo en sus componentes, igual que antes de esta iteración.
 * Extenderla es mecánico: agregar la clave acá + en `en.ts`, y reemplazar
 * el string hardcodeado por `t("clave")` en el componente.
 */
export interface Dictionary {
  language: {
    toggleLabel: string;
    current: string;
    action: string;
  };
  printMode: {
    toEco: string;
    toPremium: string;
    hintEco: string;
    hintPremium: string;
  };
  commandPalette: {
    placeholder: string;
    noResults: (query: string) => string;
    sectionActions: string;
    sectionQuests: string;
    sectionAccess: string;
    skillTreeLabel: string;
    skillTreeHint: string;
    audioMute: string;
    audioUnmute: string;
    audioHint: string;
    achievements: string;
    achievementsHint: string;
    navigateHint: string;
    selectHint: string;
  };
  footer: {
    sectionLabel: string;
    heading: string;
    tagline: string;
    formHeading: string;
    backToTop: string;
  };
  emptyState: {
    genericTitle: string;
    genericDescription: string;
  };
}

export const es: Dictionary = {
  language: {
    toggleLabel: "Cambiar a inglés",
    current: "Español",
    action: "Cambiar idioma a Inglés",
  },
  printMode: {
    toEco: "Impresión: cambiar a Premium",
    toPremium: "Impresión: cambiar a Eco",
    hintEco: "Conserva los fondos oscuros al exportar a PDF",
    hintPremium: "Texto negro sobre blanco — pensado para papel",
  },
  commandPalette: {
    placeholder: "Buscar una Quest, saltar a una sección…",
    noResults: (query: string) => `Sin resultados para "${query}".`,
    sectionActions: "Acciones",
    sectionQuests: "Quests",
    sectionAccess: "Acceso",
    skillTreeLabel: "Saltar al Skill Tree",
    skillTreeHint: "Experiencia laboral",
    audioMute: "Silenciar audio",
    audioUnmute: "Activar audio",
    audioHint: "Efectos de sonido del sitio",
    achievements: "Ver logros",
    achievementsHint: "Progreso desbloqueado en el sitio",
    navigateHint: "navegar",
    selectHint: "seleccionar",
  },
  footer: {
    sectionLabel: "Contacto",
    heading: "Hablemos de tu\npróxima Quest",
    tagline: "¿Un producto que necesita diseño y código en la misma mano? Contame la idea — la forja está encendida.",
    formHeading: "Enviar un pergamino",
    backToTop: "Volver arriba ↑",
  },
  emptyState: {
    genericTitle: "La forja está vacía",
    genericDescription: "Todavía no hay contenido publicado acá — volvé pronto.",
  },
};
