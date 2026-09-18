import type { Dictionary } from "./es";

/**
 * Diccionario EN — Minerva, Iteración 31. Ver el docblock de `es.ts` para
 * el alcance y la convención — este archivo debe mantener EXACTAMENTE la
 * misma forma que `Dictionary` (`typeof es`); `satisfies Dictionary`
 * abajo hace que TypeScript falle en build si una clave queda afuera o
 * con un tipo distinto (p.ej. un string donde `es.ts` tiene una función).
 */
export const en: Dictionary = {
  language: {
    toggleLabel: "Switch to Spanish",
    current: "English",
    action: "Switch language to Spanish",
  },
  printMode: {
    toEco: "Print: switch to Premium",
    toPremium: "Print: switch to Eco",
    hintEco: "Keeps the dark backgrounds when exporting to PDF",
    hintPremium: "Black text on white — built for paper",
  },
  commandPalette: {
    placeholder: "Search a Quest, jump to a section…",
    noResults: (query: string) => `No results for "${query}".`,
    sectionActions: "Actions",
    sectionQuests: "Quests",
    sectionAccess: "Access",
    skillTreeLabel: "Jump to the Skill Tree",
    skillTreeHint: "Work experience",
    audioMute: "Mute audio",
    audioUnmute: "Unmute audio",
    audioHint: "Site sound effects",
    achievements: "View achievements",
    achievementsHint: "Progress unlocked on the site",
    navigateHint: "navigate",
    selectHint: "select",
  },
  footer: {
    sectionLabel: "Contact",
    heading: "Let's talk about your\nnext Quest",
    tagline: "A product that needs design and code from the same hand? Tell me the idea — the forge is lit.",
    formHeading: "Send a scroll",
    backToTop: "Back to top ↑",
  },
  emptyState: {
    genericTitle: "The forge is empty",
    genericDescription: "No published content here yet — check back soon.",
  },
};
