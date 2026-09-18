import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type GlobalSettings } from "../schemas";

/**
 * Mutación de Ajustes Globales (Deméter, Iteración 22). Fila única
 * (`id = 'default'`) — upsert, así funciona aunque la fila semilla de
 * `007_settings.sql` se haya borrado. `null` = campo vacío.
 */
export async function upsertSettings(input: Omit<GlobalSettings, "updatedAt">): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("global_settings").upsert(
    {
      id: "default",
      email: input.email ?? null,
      github_url: input.githubUrl ?? null,
      linkedin_url: input.linkedinUrl ?? null,
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(`No se pudieron guardar los ajustes: ${error.message}`);
}
