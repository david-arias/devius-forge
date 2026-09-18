"use server";

import { revalidatePath, updateTag } from "next/cache";
import { upsertSettings } from "@/lib/demeter/queries/settings.mutations";
import { SettingsFormSchema, toSettingsInput } from "@/lib/minerva/forms/settings-form-schema";
import { type ActionState, toErrorState } from "./action-state";
import { requireAdminSession } from "./require-admin-session";

/**
 * updateSettings — Server Action de Ajustes Globales (Minerva, Iteración 22).
 * `updateTag("settings")` expira al instante la lectura cacheada de
 * `getSettings()`; `revalidatePath("/", "layout")` re-renderiza el layout
 * raíz (Navbar/Footer/JSON-LD viven ahí) en todas las rutas públicas.
 */
export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const parsed = SettingsFormSchema.safeParse({
      email: formData.get("email") ?? "",
      githubUrl: formData.get("githubUrl") ?? "",
      linkedinUrl: formData.get("linkedinUrl") ?? "",
    });
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    await upsertSettings(toSettingsInput(parsed.data));

    updateTag("settings");
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");

    return { status: "success", message: "Ajustes guardados — el sitio ya usa los nuevos enlaces." };
  } catch (err) {
    return toErrorState(err, "No se pudieron guardar los ajustes.");
  }
}

/** Alias con el nombre pedido en la iteración (`updateSettings`). Un archivo "use server" sólo puede exportar funciones async. */
export async function updateSettings(prev: ActionState, formData: FormData): Promise<ActionState> {
  return saveSettingsAction(prev, formData);
}
