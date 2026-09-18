"use client";

import { Loader2, Upload } from "lucide-react";
import { useId, useState } from "react";
import { getSupabaseClient, QUEST_IMAGES_BUCKET } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  /** Se llama con la URL pública del bucket apenas termina la subida. */
  onUploadComplete: (publicUrl: string) => void;
  /** Sub-carpeta dentro del bucket (p.ej. "uploads", "<quest-id>/chapters") — default "uploads". */
  folder?: string;
  className?: string;
}

/**
 * ImageUploader — Éter, Iteración 14 ("La Forja Oculta"). Único punto del
 * panel admin que habla directo con Supabase Storage — cualquier form que
 * necesite subir una imagen (Quest, capítulos de caso de estudio, avatar
 * del Character Sheet) reutiliza este componente en vez de reimplementar
 * la subida.
 *
 * Usa el mismo `QUEST_IMAGES_BUCKET`/`getSupabaseClient()` ya definidos en
 * `src/lib/supabase/client.ts` (Iteración 12) — el bucket es público para
 * lectura (RLS de `001_init.sql`) y sólo un usuario autenticado puede
 * subir, que es exactamente lo que este componente hace desde /admin.
 *
 * Path de subida: `<folder>/<timestamp>-<filename-sanitizado>` — evita
 * colisiones sin depender de que el usuario suba nombres únicos.
 *
 * Nunca lanza (`onUploadComplete` sólo se llama en éxito): cualquier error
 * de red o de Supabase se muestra inline con `role="alert"` y deja el
 * input listo para reintentar.
 */
export function ImageUploader({ onUploadComplete, folder = "uploads", className }: ImageUploaderProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputId = useId();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setErrorMessage(null);
    setFileName(file.name);

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const path = `${folder}/${Date.now()}-${sanitizedName}`;

      const supabase = getSupabaseClient();
      const { error: uploadError } = await supabase.storage
        .from(QUEST_IMAGES_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(QUEST_IMAGES_BUCKET).getPublicUrl(path);
      setStatus("idle");
      onUploadComplete(data.publicUrl);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen. Probá de nuevo."
      );
    } finally {
      // Permite volver a elegir el mismo archivo si hizo falta reintentar.
      event.target.value = "";
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-parchment-muted transition-colors duration-150",
          "hover:border-gold-glow/50 hover:text-parchment",
          status === "uploading" && "pointer-events-none opacity-60"
        )}
      >
        {status === "uploading" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Upload className="h-4 w-4" aria-hidden />
        )}
        {status === "uploading" ? "Subiendo…" : fileName ? "Cambiar imagen" : "Subir imagen"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={status === "uploading"}
        className="sr-only"
      />
      {fileName && status !== "error" && (
        <p className="text-xs text-parchment-muted/70">{fileName}</p>
      )}
      {status === "error" && errorMessage && (
        <p role="alert" className="text-xs text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
