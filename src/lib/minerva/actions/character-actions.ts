"use server";

import { revalidatePath, updateTag } from "next/cache";
import { upsertCharacter } from "@/lib/demeter/queries/character.mutations";
import { CharacterFormSchema, toCharacterInput } from "@/lib/minerva/forms/character-form-schema";
import { type ActionState, toErrorState } from "./action-state";
import { requireAdminSession } from "./require-admin-session";

/**
 * Server Action del Character Sheet (Minerva, Iteración 15) — sin
 * eliminar/duplicar: `character_sheet` es una tabla de una sola fila
 * (`id = "default"`, ver `002_admin_tables.sql`), no una colección.
 */
export async function saveCharacterAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminSession();

    const raw = Object.fromEntries(formData.entries());
    const parsed = CharacterFormSchema.safeParse(raw);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const input = toCharacterInput(parsed.data);
    await upsertCharacter(input);

    updateTag("character");
    revalidatePath("/admin/character");
    revalidatePath("/");

    return { status: "success", message: "Character Sheet guardado." };
  } catch (err) {
    return toErrorState(err, "No se pudo guardar el Character Sheet.");
  }
}
