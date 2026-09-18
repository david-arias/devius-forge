import { Backpack, Inbox, Network, ScrollText, Settings, Swords } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/hefesto/ui";
import { getCharacter } from "@/lib/demeter/queries/character";
import { getInventory } from "@/lib/demeter/queries/inventory";
import { getQuests } from "@/lib/demeter/queries/quests";
import { getSkillTree } from "@/lib/demeter/queries/skill-tree";
import { getMessages } from "@/lib/demeter/queries/messages";
import { getSettings } from "@/lib/demeter/queries/settings";

/**
 * `/admin` — dashboard de entrada (Apolo, Iteración 15 — auditoría
 * 2026-09-15, Hallazgo de Bajo Impacto: "sin vista de resumen al entrar
 * al admin... una pantalla /admin simple con tarjetas resumen (conteo
 * por sección)"). La Iteración 14 ya tenía este selector de entidad; acá
 * se le agrega el conteo real por sección — `getQuests({ includeDrafts: true })`
 * para que el borrador recién duplicado también cuente (es contenido que
 * existe y hay que revisar, aunque no esté publicado todavía).
 *
 * Server Component: las 4 queries corren en paralelo (`Promise.all`) — no
 * hay necesidad de esperarlas en cascada, ninguna depende de otra.
 */
export default async function AdminDashboardPage() {
  const [quests, skillTree, inventory, character, messages, settings] = await Promise.all([
    getQuests({ includeDrafts: true }),
    getSkillTree(),
    getInventory({ includeDrafts: true }),
    getCharacter(),
    // Iteración 22: si `messages` todavía no existe, el panel no se cae.
    getMessages({ limit: 200 }).catch(() => null),
    getSettings(),
  ]);
  const configuredLinks = [settings.email, settings.githubUrl, settings.linkedinUrl].filter(Boolean).length;

  const draftCount = quests.filter((quest) => !quest.isPublished).length;
  const unpublishedInventoryCount = inventory.filter((item) => !item.isPublished).length;

  const entities = [
    {
      href: "/admin/character",
      label: "Character Sheet",
      description: character
        ? `${character.name} — ${character.characterClass}`
        : "Ficha vacía — completala para poblar el Hero y el Character Sheet.",
      icon: ScrollText,
    },
    {
      href: "/admin/skills",
      label: "Skill Tree",
      description: `${skillTree.length} nodo${skillTree.length === 1 ? "" : "s"} de experiencia laboral.`,
      icon: Network,
    },
    {
      href: "/admin/inventory",
      label: "Inventario",
      description:
        unpublishedInventoryCount > 0
          ? `${inventory.length} tecnología${inventory.length === 1 ? "" : "s"} · ${unpublishedInventoryCount} en borrador.`
          : `${inventory.length} tecnología${inventory.length === 1 ? "" : "s"} del stack.`,
      icon: Backpack,
    },
    {
      href: "/admin/quests",
      label: "Quests",
      description:
        draftCount > 0
          ? `${quests.length} proyecto${quests.length === 1 ? "" : "s"} · ${draftCount} en borrador.`
          : `${quests.length} proyecto${quests.length === 1 ? "" : "s"} del portafolio.`,
      // (Inventario usa el mismo patrón más abajo, en su propia tarjeta.)
      icon: Swords,
    },
    {
      href: "/admin/messages",
      label: "Buzón",
      description:
        messages === null
          ? "Bandeja no disponible — ¿falta correr 006_messages.sql?"
          : `${messages.length} mensaje${messages.length === 1 ? "" : "s"} recibido${messages.length === 1 ? "" : "s"}.`,
      icon: Inbox,
    },
    {
      href: "/admin/settings",
      label: "Ajustes",
      description: `${configuredLinks} de 3 enlaces de contacto configurados.`,
      icon: Settings,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 font-display text-2xl text-parchment">La Forja Oculta</h1>
      <p className="mb-8 text-sm text-parchment-muted">
        Panel de administración — elegí qué parte del portafolio editar.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {entities.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full">
              <span
                aria-hidden
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-gold-deep/70 bg-gold-glow/10 text-gold-glow"
              >
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="font-display text-lg text-parchment">{label}</h2>
              <p className="mt-1 text-sm text-parchment-muted">{description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
