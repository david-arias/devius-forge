import { AlertTriangle, Backpack, Database, HardDrive, Inbox, Network, ScrollText, Settings, Swords } from "lucide-react";
import Link from "next/link";
import { CapacityCard, Card } from "@/components/hefesto/ui";
import { getCharacter } from "@/lib/demeter/queries/character";
import { getInventory } from "@/lib/demeter/queries/inventory";
import { getQuests } from "@/lib/demeter/queries/quests";
import { getSkillTree } from "@/lib/demeter/queries/skill-tree";
import { getMessages } from "@/lib/demeter/queries/messages";
import { getSettings } from "@/lib/demeter/queries/settings";
import { getSystemMetrics } from "@/lib/demeter/queries/system-metrics";

const measuredFmt = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

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
  const [quests, skillTree, inventory, character, messages, settings, system] = await Promise.all([
    getQuests({ includeDrafts: true }),
    getSkillTree(),
    getInventory({ includeDrafts: true }),
    getCharacter(),
    // Iteración 22: si `messages` todavía no existe, el panel no se cae.
    getMessages({ limit: 200 }).catch(() => null),
    getSettings(),
    // Iteración 41 — nunca lanza (devuelve `{ ok: false, error }`), ver `system-metrics.ts`.
    getSystemMetrics(),
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

      {/*
        Iteración 41 (Minerva/Hefesto — "Capacidad de la Forja"): uso real
        de la BD Postgres y del Storage de Supabase contra el plan Free
        (500 MB / 1 GB). Datos de `get_system_metrics()` (011_system_metrics.sql).
      */}
      <section aria-labelledby="forge-capacity" className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="forge-capacity" className="font-display text-xl text-parchment">
              Capacidad de la Forja
            </h2>
            <p className="text-sm text-parchment-muted">Uso de Supabase frente a los límites del plan gratuito.</p>
          </div>
          {system.ok && (
            <p className="text-xs text-parchment-muted/80">
              Medido: {measuredFmt.format(new Date(system.metrics.measuredAt))}
            </p>
          )}
        </div>

        {system.ok ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <CapacityCard
              icon={Database}
              label="Base de datos"
              value={system.metrics.database.label}
              limitLabel={system.metrics.database.limitLabel}
              percent={system.metrics.database.percent}
              level={system.metrics.database.level}
              details={system.metrics.topTables.map((table) => ({ label: table.name, value: table.label }))}
              footnote="Incluye índices y catálogos internos de Postgres — por eso nunca arranca en 0."
            />
            <CapacityCard
              icon={HardDrive}
              label="Storage (archivos)"
              value={system.metrics.storage.label}
              limitLabel={system.metrics.storage.limitLabel}
              percent={system.metrics.storage.percent}
              level={system.metrics.storage.level}
              details={[
                { label: "Archivos totales", value: String(system.metrics.storage.objects) },
                ...system.metrics.buckets.map((bucket) => ({
                  label: `${bucket.id} (${bucket.objects})`,
                  value: bucket.label,
                })),
              ]}
              footnote="Para liberar espacio, borrá archivos sin usar desde La Bóveda (/admin/media)."
            />
          </div>
        ) : (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-gold-glow/30 bg-gold-glow/5 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-glow" aria-hidden />
            <div>
              <p className="font-semibold text-parchment">Métricas no disponibles</p>
              <p className="mt-1 text-parchment-muted">{system.error}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
