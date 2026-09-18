import {
  CharacterSheet,
  Hero,
  Inventory,
  QuestShowcase,
  SkillTree,
} from "@/components/hefesto/sections";
import { ScrollToHash } from "@/components/hefesto/ui";
import {
  getCharacterForView,
  getQuestsForView,
  getSkillTreeForView,
  getInventoryForView,
  getNavigationForView,
} from "@/lib/minerva";

/** Separador sutil entre secciones — sólo ritmo visual, nada más. */
function Divider() {
  return (
    <div
      aria-hidden
      className="mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-white/10 to-transparent"
    />
  );
}

/**
 * Home — Apolo: la página pasó de una sola vista comprimida (bento grid) a
 * una landing de flujo vertical que cuenta una historia:
 * Hero → Character Sheet → Skill Tree → Quests → Inventario.
 * Cada sección gestiona su propio contenedor/padding; aquí sólo se ensamblan
 * en orden y se separan con un divisor sutil. Navbar/Footer viven en
 * `layout.tsx` (son globales al sitio, no a esta página).
 */
export default async function Home() {
  const [character, quests, skillNodes, inventory, navigation] = await Promise.all([
    getCharacterForView(),
    getQuestsForView(),
    getSkillTreeForView(),
    getInventoryForView(),
    getNavigationForView(),
  ]);

  const emailLink = navigation.socialLinks.find((link) => link.kind === "email");
  // Etiquetas flotantes del Hero (Iteración 19): los ítems de mayor nivel del Inventario real.
  const heroTags = [...inventory]
    .sort((a, b) => b.level - a.level)
    .slice(0, 3)
    .map((item) => item.name);

  return (
    <main className="relative flex-1">
      {/* Fix del botón "Volver a Quests" (Iteración 12) — ver ScrollToHash.tsx */}
      <ScrollToHash />
      <Hero character={character} tags={heroTags} ctaHref={emailLink?.href} resumeHref="/cv-devius.pdf" />
      <Divider />
      <CharacterSheet character={character} />
      <Divider />
      <SkillTree nodes={skillNodes} />
      <Divider />
      <QuestShowcase quests={quests} />
      <Divider />
      <Inventory items={inventory} />
    </main>
  );
}
