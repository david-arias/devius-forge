"use server";

import { revalidatePath, updateTag } from "next/cache";
import { bulkUpdateSkillTreeOrder, deleteSkillNode, duplicateSkillNode, upsertSkillNode } from "@/lib/demeter/queries/skill-tree.mutations";
import { SkillsFormSchema, toSkillNodeInput } from "@/lib/minerva/forms/skills-form-schema";
import { type ActionState, toErrorState } from "./action-state";
import { requireAdminSession } from "./require-admin-session";

/** Server Actions del Skill Tree (Minerva, Iteración 15, `updateTag` agregado en la 16 "CMS V2") — mismo patrón que `quest-actions.ts`. */

function parseFormData(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    label: String(formData.get("label") ?? ""),
    period: String(formData.get("period") ?? ""),
    description: String(formData.get("description") ?? ""),
    achievements: String(formData.get("achievements") ?? ""),
    // Los checkboxes desmarcados no se incluyen en un `FormData` nativo —
    // `formData.get("unlocked")` da `null` en vez de `"off"`.
    unlocked: formData.get("unlocked") === "on",
    // Iteración 32 (i18n) — traducciones EN, todas opcionales (ver `SkillsFormSchema`).
    labelEn: String(formData.get("labelEn") ?? ""),
    descriptionEn: String(formData.get("descriptionEn") ?? ""),
    achievementsEn: String(formData.get("achievementsEn") ?? ""),
  };
}

export async function saveSkillNodeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const parsed = SkillsFormSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const input = toSkillNodeInput(parsed.data);
    await upsertSkillNode(input);

    updateTag("skill-tree");
    revalidatePath("/admin/skills");
    revalidatePath("/");

    return { status: "success", message: `Nodo "${input.label}" guardado.` };
  } catch (err) {
    return toErrorState(err, "No se pudo guardar el nodo.");
  }
}

export async function deleteSkillNodeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const id = String(formData.get("id") ?? "");
    if (!id) return { status: "error", message: "Falta el id del nodo a eliminar." };

    await deleteSkillNode(id);

    updateTag("skill-tree");
    revalidatePath("/admin/skills");
    revalidatePath("/");

    return { status: "success", message: "Nodo eliminado." };
  } catch (err) {
    return toErrorState(err, "No se pudo eliminar el nodo.");
  }
}

export async function duplicateSkillNodeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const id = String(formData.get("id") ?? "");
    if (!id) return { status: "error", message: "Falta el id del nodo a duplicar." };

    const copy = await duplicateSkillNode(id);

    updateTag("skill-tree");
    revalidatePath("/admin/skills");

    return { status: "success", message: `Nodo duplicado (oculto hasta desbloquearlo): "${copy.label}".` };
  } catch (err) {
    return toErrorState(err, "No se pudo duplicar el nodo.");
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
export async function updateSkillTreeOrderAction(
  order: { id: string; order: number }[]
): Promise<ActionState> {
  try {
    await requireAdminSession();

    if (order.length === 0) {
      return { status: "error", message: "No hay elementos para reordenar." };
    }

    await bulkUpdateSkillTreeOrder(order);

    updateTag("skill-tree");
    revalidatePath("/admin/skills");
    revalidatePath("/");

    return { status: "success", message: "Orden actualizado." };
  } catch (err) {
    return toErrorState(err, "No se pudo actualizar el orden del skill tree.");
  }
}
