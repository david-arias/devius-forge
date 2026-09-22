"use server";

import { revalidatePath } from "next/cache";
import { deleteStorageFile } from "@/lib/demeter/queries/storage";
import { type ActionState, toErrorState } from "./action-state";
import { requireAdminSession } from "./require-admin-session";

/**
 * Server Actions del Gestor de Archivos (`/admin/media`) — Minerva,
 * Iteración 40 ("Control Total"). Como `updateQuestsOrderAction`, NO se
 * ata a un `<form action>`: `MediaVault` la llama directo con el path
 * (dentro de un `startTransition`) y usa el `ActionState` devuelto para
 * el Toast (`AdminToastHost`).
 *
 * Importante: borrar un archivo NO limpia las referencias que lo usan
 * (una Quest seguiría apuntando a una URL rota). Por eso `MediaVault`
 * muestra "En uso por…" y lo repite en el modal de confirmación antes de
 * llamar a esta acción.
 */
export async function deleteMediaAction(path: string): Promise<ActionState> {
  try {
    await requireAdminSession();
    await deleteStorageFile(path);

    revalidatePath("/admin/media");

    const name = path.split("/").pop() ?? path;
    return { status: "success", message: `Archivo "${name}" eliminado del bucket.` };
  } catch (err) {
    return toErrorState(err, "No se pudo eliminar el archivo.");
  }
}
