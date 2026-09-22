import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { getStorageUsage, listStorageFiles, type StorageFile } from "@/lib/demeter/queries/storage";
import { MediaVault } from "@/lib/minerva/forms/MediaVault";

export const metadata: Metadata = { title: "Bóveda de Archivos" };

/**
 * `/admin/media` — "La Bóveda" (Hefesto/Deméter, Iteración 40, "Control
 * Total"). Server Component: lista TODO el bucket `quest-images`
 * (`listStorageFiles`, recursivo) y calcula dónde se usa cada archivo
 * (`getStorageUsage`) en el mismo request; la galería interactiva
 * (filtros, copiar URL, borrar) vive en `MediaVault` (cliente).
 *
 * Es dinámica por naturaleza: `createServerSupabaseClient()` lee
 * `cookies()` (sesión del admin), así que nunca se prerenderiza.
 * `deleteMediaAction` hace `revalidatePath("/admin/media")` después de
 * cada borrado.
 */
export default async function AdminMediaPage() {
  let files: StorageFile[] = [];
  let usage: Record<string, string[]> = {};
  let loadError: string | null = null;

  try {
    files = await listStorageFiles("");
    usage = await getStorageUsage(files.map((file) => file.path));
  } catch (err) {
    loadError = err instanceof Error ? err.message : "No se pudo leer el bucket de Supabase.";
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl text-parchment">La Bóveda</h1>
        <p className="max-w-2xl text-sm text-parchment-muted">
          Todos los archivos del bucket <code className="rounded bg-white/5 px-1.5 py-0.5 text-parchment">quest-images</code>{" "}
          de Supabase. Copiá una URL para pegarla en cualquier formulario, o eliminá lo que ya no uses. Los archivos
          marcados <span className="text-gold-glow">En uso</span> están referenciados por alguna sección del sitio.
        </p>
      </header>

      {loadError ? (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-parchment">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
          <div>
            <p className="font-semibold text-danger">No se pudo abrir la Bóveda</p>
            <p className="mt-1 text-parchment-muted">{loadError}</p>
          </div>
        </div>
      ) : (
        <MediaVault files={files} usage={usage} />
      )}
    </div>
  );
}
