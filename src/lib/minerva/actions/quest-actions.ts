"use server";

import { revalidatePath, updateTag } from "next/cache";
import { bulkUpdateQuestOrder, deleteQuest, duplicateQuest, upsertQuest } from "@/lib/demeter/queries/quests.mutations";
import { deleteStorageFolder } from "@/lib/demeter/queries/storage";
import { QuestFormSchema, toQuestInput } from "@/lib/minerva/forms/quest-form-schema";
import { type ActionState, toErrorState } from "./action-state";
import { requireAdminSession } from "./require-admin-session";

/**
 * Server Actions de Quests (Minerva, Iteración 15, actualizado en la 16
 * "CMS V2"). Cada acción se pasa como `action` de un `<form>` (vía
 * `useActionState`), lo que le da al formulario POST real de fábrica
 * incluso si React nunca llega a hidratar.
 *
 * `updateTag("quests")` (Iteración 16) invalida el `unstable_cache`
 * de `getQuests()` (`src/lib/demeter/queries/quests.ts`) apenas termina
 * de escribir — sin esto, el caché nuevo serviría datos viejos hasta que
 * expirara solo, y como no le pusimos `revalidate` (TTL) a propósito,
 * nunca expiraría. `revalidatePath` se mantiene además, para que Next
 * también refresque el RSC payload de las rutas ya renderizadas.
 */

function parseFormData(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    // Iteración 34 — ver `upsertQuest()` en `quests.mutations.ts`: sin
    // esto, renombrar el slug de una Quest existente crea un duplicado
    // huérfano en vez de renombrarla. String vacío en la Quest "Nueva".
    originalId: String(formData.get("originalId") ?? ""),
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    role: String(formData.get("role") ?? ""),
    tech: String(formData.get("tech") ?? ""),
    href: String(formData.get("href") ?? ""),
    status: String(formData.get("status") ?? ""),
    // Los checkboxes desmarcados no se incluyen en un `FormData` nativo —
    // `formData.get("isPublished")` da `null` en vez de `"off"`.
    isPublished: formData.get("isPublished") === "on",
    accentColor: String(formData.get("accentColor") ?? ""),
    placeholderFrom: String(formData.get("placeholderFrom") ?? ""),
    placeholderTo: String(formData.get("placeholderTo") ?? ""),
    problem: String(formData.get("problem") ?? ""),
    uxProcess: String(formData.get("uxProcess") ?? ""),
    uiSolution: String(formData.get("uiSolution") ?? ""),
    impact: String(formData.get("impact") ?? ""),
    // Iteración 31 (i18n) — traducciones EN, todas opcionales (ver `QuestFormSchema`).
    titleEn: String(formData.get("titleEn") ?? ""),
    summaryEn: String(formData.get("summaryEn") ?? ""),
    roleEn: String(formData.get("roleEn") ?? ""),
    problemEn: String(formData.get("problemEn") ?? ""),
    uxProcessEn: String(formData.get("uxProcessEn") ?? ""),
    uiSolutionEn: String(formData.get("uiSolutionEn") ?? ""),
    impactEn: String(formData.get("impactEn") ?? ""),
    // Iteración 34 (Hefesto/Éter, "Expansión de Media") — URLs subidas
    // vía `ImageUploader`, ver `QuestForm.tsx`.
    coverImageUrl: String(formData.get("coverImageUrl") ?? ""),
    chapterImageProblem: String(formData.get("chapterImageProblem") ?? ""),
    chapterImageUxProcess: String(formData.get("chapterImageUxProcess") ?? ""),
    chapterImageUiSolution: String(formData.get("chapterImageUiSolution") ?? ""),
    chapterImageImpact: String(formData.get("chapterImageImpact") ?? ""),
    // Iteración 39 — video del Scroll-Bound Hero.
    heroVideoUrl: String(formData.get("heroVideoUrl") ?? ""),
  };
}

export async function saveQuestAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const parsed = QuestFormSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const input = toQuestInput(parsed.data);
    const previousId = parsed.data.originalId || undefined;
    await upsertQuest(input, previousId);

    updateTag("quests");
    revalidatePath("/admin/quests");
    revalidatePath("/sitemap.xml");
    // El comodín con literal de segmento dinámico (Next.js) invalida TODAS
    // las páginas `/quests/[slug]` ya generadas o cacheadas.
    revalidatePath("/quests/[slug]", "page");
    // Defensa adicional (Iteración 34, Apolo — fix del "slug 404"): además
    // del comodín de arriba, se revalida el path EXACTO del slug nuevo —
    // por si la Quest se está publicando por primera vez y todavía no
    // existía ninguna entrada de caché que el comodín pudiera invalidar.
    revalidatePath(`/quests/${input.id}`);
    // Si el slug cambió (rename), la URL VIEJA también se revalida — sin
    // esto seguiría sirviendo el HTML cacheado de la Quest ya borrada
    // hasta su próximo `revalidate` natural.
    if (previousId && previousId !== input.id) {
      revalidatePath(`/quests/${previousId}`);
    }
    revalidatePath("/");

    return { status: "success", message: `Quest "${input.title}" guardada.` };
  } catch (err) {
    return toErrorState(err, "No se pudo guardar la quest.");
  }
}

export async function deleteQuestAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const id = String(formData.get("id") ?? "");
    if (!id) return { status: "error", message: "Falta el id de la quest a eliminar." };

    await deleteQuest(id);

    // Iteración 40 ("Control Total") — opcional, marcado en el modal de
    // confirmación: borra también `quest-images/<id>/**` (portada,
    // capítulos, video del hero). Va DESPUÉS de borrar la fila: si esto
    // falla, la Quest ya no existe y los archivos quedan huérfanos pero
    // recuperables desde /admin/media — nunca al revés (Quest viva con
    // imágenes rotas).
    let purgeNote = "";
    if (formData.get("purgeMedia") === "on") {
      try {
        const removed = await deleteStorageFolder(id);
        purgeNote = removed > 0 ? ` Se borraron ${removed} archivo(s) de la Bóveda.` : "";
      } catch (purgeError) {
        console.error(`[Minerva] deleteQuestAction: no se pudo vaciar quest-images/${id}/`, purgeError);
        purgeNote = " (Sus archivos no se pudieron borrar — limpialos desde La Bóveda.)";
      }
    }

    updateTag("quests");
    revalidatePath("/admin/quests");
    revalidatePath("/admin/media");
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
    // La página pública de ESA Quest tiene que dejar de servirse ya (404),
    // no cuando expire su caché.
    revalidatePath(`/quests/${id}`);
    revalidatePath("/quests/[slug]", "page");
    revalidatePath("/");

    return { status: "success", message: `Quest eliminada.${purgeNote}` };
  } catch (err) {
    return toErrorState(err, "No se pudo eliminar la quest.");
  }
}

export async function duplicateQuestAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const id = String(formData.get("id") ?? "");
    if (!id) return { status: "error", message: "Falta el id de la quest a duplicar." };

    const copy = await duplicateQuest(id);

    updateTag("quests");
    revalidatePath("/admin/quests");
    revalidatePath("/sitemap.xml");

    return { status: "success", message: `Quest duplicada como borrador: "${copy.title}".` };
  } catch (err) {
    return toErrorState(err, "No se pudo duplicar la quest.");
  }
}


/**
 * Reordenamiento por Drag & Drop (Minerva/Deméter, Iteración 17
 * "Escalabilidad del CMS"). A diferencia de `save*Action`/`delete*Action`/
 * `duplicate*Action`, este Server Action NO se ata a un `<form action>` —
 * se llama directo desde el cliente (`startTransition(() => updateXOrderAction(order))`)
 * apenas termina un drag, así que recibe el array `{ id, order }[]` ya
 * armado en vez de `FormData`. Sigue devolviendo `ActionState` para
 * reusar el mismo Toast (`AdminToastHost`) que el resto de las acciones.
 */
export async function updateQuestsOrderAction(
  order: { id: string; order: number }[]
): Promise<ActionState> {
  try {
    await requireAdminSession();

    if (order.length === 0) {
      return { status: "error", message: "No hay elementos para reordenar." };
    }

    await bulkUpdateQuestOrder(order);

    updateTag("quests");
    revalidatePath("/admin/quests");
    revalidatePath("/sitemap.xml");
    revalidatePath("/");

    return { status: "success", message: "Orden actualizado." };
  } catch (err) {
    return toErrorState(err, "No se pudo actualizar el orden de las quests.");
  }
}
