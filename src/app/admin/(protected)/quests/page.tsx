import { getQuests } from "@/lib/demeter/queries/quests";
import { QuestForm } from "@/lib/minerva/forms/QuestForm";
import { QuestsManager } from "@/lib/minerva/forms/QuestsManager";

/**
 * `/admin/quests` — Minerva, Iteración 15, rediseñado en la 17
 * ("Escalabilidad del CMS") como lista de acordeón con buscador y
 * reordenamiento Drag & Drop (`QuestsManager`, Hefesto/Minerva/Deméter)
 * en vez de un `QuestForm` completo por Quest siempre expandido. La
 * Quest "Nueva" queda fuera del `QuestsManager` (no es arrastrable, no
 * tiene qué colapsar) — siempre visible y expandida al final.
 */
export default async function AdminQuestsPage() {
  const quests = await getQuests({ includeDrafts: true });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="font-display text-2xl text-parchment">Quests</h1>

      <QuestsManager quests={quests} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-parchment-muted">
          Nueva Quest
        </h2>
        <QuestForm />
      </div>
    </div>
  );
}
