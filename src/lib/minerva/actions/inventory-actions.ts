"use server";

import { revalidatePath, updateTag } from "next/cache";
import {
  bulkUpdateInventoryOrder,
  deleteInventoryItem,
  duplicateInventoryItem,
  upsertInventoryItem,
} from "@/lib/demeter/queries/inventory.mutations";
import { InventoryFormSchema, toInventoryItemInput } from "@/lib/minerva/forms/inventory-form-schema";
import { type ActionState, toErrorState } from "./action-state";
import { requireAdminSession } from "./require-admin-session";

/** Server Actions del Inventario (Minerva, Iteración 15, `isPublished`/`updateTag` agregados en la 16 "CMS V2") — mismo patrón que `quest-actions.ts`. */

function parseFormData(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    rarity: String(formData.get("rarity") ?? ""),
    level: Number(formData.get("level") ?? 0),
    // Los checkboxes desmarcados no se incluyen en un `FormData` nativo —
    // `formData.get("isPublished")` da `null` en vez de `"off"`.
    isPublished: formData.get("isPublished") === "on",
  };
}

export async function saveInventoryItemAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const parsed = InventoryFormSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const input = toInventoryItemInput(parsed.data);
    await upsertInventoryItem(input);

    updateTag("inventory");
    revalidatePath("/admin/inventory");
    revalidatePath("/");

    return { status: "success", message: `Ítem "${input.name}" guardado.` };
  } catch (err) {
    return toErrorState(err, "No se pudo guardar el ítem.");
  }
}

export async function deleteInventoryItemAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const id = String(formData.get("id") ?? "");
    if (!id) return { status: "error", message: "Falta el id del ítem a eliminar." };

    await deleteInventoryItem(id);

    updateTag("inventory");
    revalidatePath("/admin/inventory");
    revalidatePath("/");

    return { status: "success", message: "Ítem eliminado." };
  } catch (err) {
    return toErrorState(err, "No se pudo eliminar el ítem.");
  }
}

export async function duplicateInventoryItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdminSession();

    const id = String(formData.get("id") ?? "");
    if (!id) return { status: "error", message: "Falta el id del ítem a duplicar." };

    const copy = await duplicateInventoryItem(id);

    updateTag("inventory");
    revalidatePath("/admin/inventory");

    return { status: "success", message: `Ítem duplicado: "${copy.name}".` };
  } catch (err) {
    return toErrorState(err, "No se pudo duplicar el ítem.");
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
export async function updateInventoryOrderAction(
  order: { id: string; order: number }[]
): Promise<ActionState> {
  try {
    await requireAdminSession();

    if (order.length === 0) {
      return { status: "error", message: "No hay elementos para reordenar." };
    }

    await bulkUpdateInventoryOrder(order);

    updateTag("inventory");
    revalidatePath("/admin/inventory");
    revalidatePath("/");

    return { status: "success", message: "Orden actualizado." };
  } catch (err) {
    return toErrorState(err, "No se pudo actualizar el orden del inventario.");
  }
}
