import type { MetadataRoute } from "next";
import { getQuests } from "@/lib/demeter/queries/quests";
import { SITE_URL } from "@/lib/site";

/**
 * sitemap.xml — Apolo, Iteración 23.
 * Rutas estáticas + una entrada por Quest PUBLICADA (`getQuests()` ya
 * filtra `isPublished === true` por defecto; nunca se pasa
 * `includeDrafts`). Nunca incluye `/admin` ni `/api`.
 *
 * Frescura: se regenera como mucho cada hora (ISR) y, además, cada
 * Server Action de Quests llama `revalidatePath("/sitemap.xml")`.
 * Si Supabase falla, `getQuests()` devuelve `[]` y el sitemap sale sólo
 * con la home — nunca rompe el build ni devuelve 500.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const quests = await getQuests();

  const questEntries: MetadataRoute.Sitemap = quests
    .filter((quest) => quest.isPublished)
    .map((quest) => ({
      url: `${SITE_URL}/quests/${encodeURIComponent(quest.id)}`,
      lastModified: quest.updatedAt ? new Date(quest.updatedAt) : undefined,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  const latestQuestUpdate = questEntries
    .map((entry) => entry.lastModified)
    .filter((date): date is Date => date instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return [
    {
      url: SITE_URL,
      lastModified: latestQuestUpdate ?? new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...questEntries,
  ];
}
