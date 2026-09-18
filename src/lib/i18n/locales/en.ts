import type { Dictionary } from "./es";

/**
 * Diccionario EN — Minerva/Apolo, Iteración 31, completado en la 32
 * ("i18n Absoluto"). Ver el docblock de `es.ts` para el alcance y la
 * convención — este archivo debe mantener EXACTAMENTE la misma forma
 * que `Dictionary`; el tipo explícito abajo hace que TypeScript falle en
 * build si una clave queda afuera o con un tipo distinto.
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
  hero: {
    availableBadge: "Available for new quests",
    helloPrefix: (name: string) => `Hi, I'm ${name}`,
    startQuestCta: "Start Quest",
    downloadCta: "Download CV",
    scrollLabel: "Scroll",
    homeLabel: "Home",
    emptyNotice: "The Character Sheet has no data yet. Fill it in from the panel to light up the Hero.",
    forgeEmptyTitle: "The forge\nis empty",
  },
  characterSheet: {
    eyebrow: "Character",
    emptyTitle: "The scroll is blank",
    emptyDescription: "This sheet hasn't been written yet. The story behind the forge will show up here soon.",
    uxuiTitle: "UX/UI Design",
    uxuiDescription: "I research, iterate and validate before a single line of code exists.",
    frontendTitle: "Frontend Engineering",
    frontendDescription: "I turn every design decision into real interfaces: performant, animated and accessible.",
  },
  skillTree: {
    eyebrow: "Progression",
    emptyTitle: "The tree has no branches yet",
    emptyDescription: "Professional progression is being documented. Check back soon to see each node unlocked.",
    nodePrefix: (num: string) => `Node ${num}`,
    lockedSuffix: " · Locked",
    xpBadge: "+XP",
  },
  inventory: {
    eyebrow: "Gear",
    emptyTitle: "The inventory is empty",
    emptyDescription: "This forge's weapons and artifacts are still being catalogued.",
    groups: {
      frontend: "Main Weapons",
      design: "Design Artifacts",
      animation: "Magic / Animation",
      backend: "Backend Artifacts",
      devops: "Camp Tools",
      tools: "Tools",
    },
  },
  questShowcase: {
    eyebrow: "Logbook",
    emptyTitle: "The forge is empty",
    emptyDescription: "The next case studies are being tempered. Every published Quest will show up here.",
  },
  contactForm: {
    ariaLabel: "Contact form",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@email.com",
    messageLabel: "Message",
    messagePlaceholder: "Tell me about your next Quest…",
    responseTime: "I reply in under 48h. No spam, ever.",
    submitIdle: "Send message",
    submitPending: "Forging…",
    toastSuccessTitle: "Message forged!",
    toastErrorTitle: "The forge went cold",
    closeNotification: "Close notification",
  },
};
