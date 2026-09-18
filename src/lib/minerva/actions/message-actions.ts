"use server";

import { revalidatePath } from "next/cache";
import { deleteMessage } from "@/lib/demeter/queries/messages.mutations";
import { type ActionState, toErrorState } from "./action-state";
import { requireAdminSession } from "./require-admin-session";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Bandeja de la Forja (Minerva, Iteración 22). La lectura (`getMessages`)
 * no se cachea (datos privados por sesión), así que acá alcanza con
 * `revalidatePath` de las vistas del panel que la muestran.
 */
export async function deleteMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const id = String(formData.get("id") ?? "");
    if (!UUID_RE.test(id)) return { status: "error", message: "Id de mensaje inválido." };

    await deleteMessage(id);

    revalidatePath("/admin/messages");
    revalidatePath("/admin");

    return { status: "success", message: "Mensaje eliminado de la bandeja." };
  } catch (err) {
    return toErrorState(err, "No se pudo eliminar el mensaje.");
  }
}
