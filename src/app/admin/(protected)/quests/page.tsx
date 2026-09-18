import { extractQuestEnDraft, getQuestsRaw, type QuestEnDraft } from "@/lib/demeter/queries/quests";
import { mapSupabaseQuestRow } from "@/lib/supabase/schema";
import { QuestForm } from "@/lib/minerva/forms/QuestForm";
import { QuestsManager } from "@/lib/minerva/forms/QuestsManager";

/**
 * `/admin/quests` — Minerva, Iteración 15, rediseñado en la 17
 * ("Escalabilidad del CMS") como lista de acordeón con buscador y
 * reordenamiento Drag & Drop (`QuestsManager`, Hefesto/Minerva/Deméter)
 * en vez de un `QuestForm` completo por Quest siempre expandido. La
 * Quest "Nueva" queda fuera del `QuestsManager` (no es arrastrable, no
 * tiene qué colapsar) — siempre visible y expandida al final.
 *
 * Iteración 32 (i18n, "Absoluto") — fix de la precarga: en vez de
 * `getQuests({ includeDrafts: true })` (que sólo devuelve el contenido
 * YA resuelto en español), se lee `getQuestsRaw()` — la fila cruda con
 * sus columnas `_en` — y de ahí se derivan TANTO el `Quest` en español
 * (`mapSupabaseQuestRow(row, "es")`, mismo resultado de antes) COMO el
 * borrador de traducción EN (`extractQuestEnDraft(row)`) que
 * `QuestForm` necesita para precargar la pestaña "English" al reabrir
 * una Quest existente. Un solo fetch, dos vistas de la misma fila.
 */
export default async function AdminQuestsPage() {
  const rows = await getQuestsRaw({ includeDrafts: true });
  const quests = rows.map((row) => mapSupabaseQuestRow(row, "es"));
  const enDrafts: Record<string, QuestEnDraft> = Object.fromEntries(
    rows.map((row) => [row.id, extractQuestEnDraft(row)])
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="font-display text-2xl text-parchment">Quests</h1>

      <QuestsManager quests={quests} enDrafts={enDrafts} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-parchment-muted">
          Nueva Quest
        </h2>
        <QuestForm />
      </div>
    </div>
  );
}
