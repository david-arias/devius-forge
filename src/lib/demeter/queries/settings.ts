import { unstable_cache } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase/client";
import { GlobalSettingsSchema, type GlobalSettings } from "../schemas";

/**
 * Repositorio de Ajustes Globales (Deméter, Iteración 22) — SOLO LECTURA,
 * seguro para el sitio público (la tabla tiene SELECT público por RLS).
 * Mismo patrón que `character.ts`: `unstable_cache` con tag `"settings"`,
 * invalidado por `saveSettingsAction` con `updateTag("settings")`.
 *
 * Supabase caído / tabla inexistente / fila vacía ⇒ `{}` (sin enlaces):
 * el sitio sigue renderizando, sólo oculta lo que no está configurado.
 */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

async function fetchSettingsUncached(): Promise<unknown> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("global_settings")
      .select("email, github_url, linkedin_url, updated_at")
      .eq("id", "default")
      .maybeSingle();

    if (error) throw error;
    if (!data) return {};

    return {
      email: blankToUndefined(data.email),
      githubUrl: blankToUndefined(data.github_url),
      linkedinUrl: blankToUndefined(data.linkedin_url),
      updatedAt: data.updated_at ?? undefined,
    };
  } catch (err) {
    console.warn("[Deméter] No se pudo leer public.global_settings — sin enlaces de contacto.", err);
    return {};
  }
}

const getCachedSettingsRaw = unstable_cache(fetchSettingsUncached, ["demeter-global-settings"], {
  tags: ["settings"],
});

export async function getSettings(): Promise<GlobalSettings> {
  const raw = await getCachedSettingsRaw();
  const parsed = GlobalSettingsSchema.safeParse(raw);
  // Un valor inválido guardado a mano en la base no debe tumbar el layout de todo el sitio.
  return parsed.success ? parsed.data : {};
}
