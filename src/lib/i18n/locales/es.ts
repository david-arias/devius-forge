/**
 * Diccionario ES — Minerva/Apolo, Iteración 31 ("Expansión Global"),
 * completado en la 32 ("i18n Absoluto"). Textos ESTÁTICOS de la UI (los
 * que Hefesto escribe en el JSX, no los que vienen de Supabase — esos
 * los traduce Deméter, ver `_en` en `009_i18n.sql`). Se consume con
 * `useTranslation()` (componentes cliente) o `getTranslations()`
 * (Server Components, `lib/i18n/get-translations.ts`) — nunca
 * importando este archivo directo desde un componente.
 *
 * Iteración 32: cobertura ampliada a Hero, Character Sheet, Skill Tree
 * (incl. `SkillTreeTimeline`), Inventory y el formulario de contacto del
 * Footer — el resto de la copy (admin/CMS, textos de logros/telemetría)
 * sigue en español directo, fuera del alcance pedido ("copy estática del
 * SITIO PÚBLICO").
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
  hero: {
    availableBadge: string;
    helloPrefix: (name: string) => string;
    startQuestCta: string;
    downloadCta: string;
    scrollLabel: string;
    homeLabel: string;
    emptyNotice: string;
    forgeEmptyTitle: string;
  };
  characterSheet: {
    eyebrow: string;
    emptyTitle: string;
    emptyDescription: string;
    uxuiTitle: string;
    uxuiDescription: string;
    frontendTitle: string;
    frontendDescription: string;
  };
  skillTree: {
    eyebrow: string;
    emptyTitle: string;
    emptyDescription: string;
    nodePrefix: (num: string) => string;
    lockedSuffix: string;
    xpBadge: string;
  };
  inventory: {
    eyebrow: string;
    emptyTitle: string;
    emptyDescription: string;
    groups: {
      frontend: string;
      design: string;
      animation: string;
      backend: string;
      devops: string;
      tools: string;
    };
  };
  questShowcase: {
    eyebrow: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  contactForm: {
    ariaLabel: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    responseTime: string;
    submitIdle: string;
    submitPending: string;
    toastSuccessTitle: string;
    toastErrorTitle: string;
    closeNotification: string;
    errors: {
      nameMin: string;
      nameMax: string;
      emailMax: string;
      emailInvalid: string;
      contentMin: string;
      contentMax: string;
      generic: string;
    };
    serverSuccess: string;
    serverErrorFallback: string;
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
  hero: {
    availableBadge: "Disponible para nuevas quests",
    helloPrefix: (name: string) => `Hola, soy ${name}`,
    startQuestCta: "Iniciar Quest",
    downloadCta: "Descargar CV",
    scrollLabel: "Scroll",
    homeLabel: "Inicio",
    emptyNotice: "El Character Sheet todavía no tiene datos. Completalo desde el panel para encender el Hero.",
    forgeEmptyTitle: "La forja\nestá vacía",
  },
  characterSheet: {
    eyebrow: "Personaje",
    emptyTitle: "El pergamino está en blanco",
    emptyDescription: "Esta ficha todavía no fue escrita. Pronto vas a encontrar acá la historia detrás de la forja.",
    uxuiTitle: "UX/UI Design",
    uxuiDescription: "Investigo, itero y valido con research y prototipado antes de que exista una sola línea de código.",
    frontendTitle: "Frontend Engineering",
    frontendDescription: "Convierto cada decisión de diseño en interfaces reales: performantes, animadas y accesibles.",
  },
  skillTree: {
    eyebrow: "Progresión",
    emptyTitle: "El árbol aún no tiene ramas",
    emptyDescription: "La progresión profesional se está documentando. Volvé pronto para ver cada nodo desbloqueado.",
    nodePrefix: (num: string) => `Nodo ${num}`,
    lockedSuffix: " · Bloqueado",
    xpBadge: "+XP",
  },
  inventory: {
    eyebrow: "Equipo",
    emptyTitle: "El inventario está vacío",
    emptyDescription: "Las armas y artefactos de esta forja todavía se están catalogando.",
    groups: {
      frontend: "Armas Principales",
      design: "Artefactos de Diseño",
      animation: "Magia / Animación",
      backend: "Artefactos de Backend",
      devops: "Herramientas de Campamento",
      tools: "Herramientas",
    },
  },
  questShowcase: {
    eyebrow: "Bitácora",
    emptyTitle: "La forja está vacía",
    emptyDescription: "Los próximos casos de estudio se están templando. Cada Quest publicada aparecerá acá.",
  },
  contactForm: {
    ariaLabel: "Formulario de contacto",
    nameLabel: "Nombre",
    namePlaceholder: "Tu nombre",
    emailLabel: "Correo",
    emailPlaceholder: "tu@correo.com",
    messageLabel: "Mensaje",
    messagePlaceholder: "Contame sobre tu próxima Quest…",
    responseTime: "Respondo en menos de 48 h. Sin spam, nunca.",
    submitIdle: "Enviar mensaje",
    submitPending: "Forjando…",
    toastSuccessTitle: "¡Mensaje forjado!",
    toastErrorTitle: "La forja se enfrió",
    closeNotification: "Cerrar notificación",
    errors: {
      nameMin: "Tu nombre necesita al menos 2 letras.",
      nameMax: "El nombre es demasiado largo (máx. 80).",
      emailMax: "El correo es demasiado largo.",
      emailInvalid: "Ese correo no parece válido.",
      contentMin: "Contame un poco más (mínimo 10 caracteres).",
      contentMax: "El mensaje es demasiado largo (máx. 2000).",
      generic: "Revisá los campos del formulario.",
    },
    serverSuccess: "Mensaje enviado a través de la Forja.",
    serverErrorFallback: "La forja no pudo enviar tu mensaje. Probá de nuevo o escribime por correo.",
  },
};
