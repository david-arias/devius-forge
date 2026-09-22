"use client";

import { Link2, Loader2, Trash2, Upload } from "lucide-react";
import { useId, useState } from "react";
import { getSupabaseClient, QUEST_IMAGES_BUCKET } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  /** Se llama con la URL pública del bucket apenas termina la subida (o con la URL pegada, si `allowUrlPaste`). */
  onUploadComplete: (publicUrl: string) => void;
  /** Sub-carpeta dentro del bucket (p.ej. "uploads", "<quest-id>/chapters") — default "uploads". */
  folder?: string;
  className?: string;
  /**
   * Iteración 39 (Minerva/Hefesto — "Control de Medios"): URL ACTUAL del
   * campo (la que ya está guardada en la base, recién subida o pegada).
   * Si viene, el uploader muestra una miniatura + el botón "Quitar".
   * Opcional para no romper a `CharacterForm`, que tiene su propio preview.
   */
  value?: string | null;
  /**
   * Limpia el campo en el formulario (`setValue(campo, "")`). Al guardar,
   * `toQuestInput()` convierte el string vacío en `undefined` → Deméter
   * escribe `null` en la columna → el frontend público cae al gradiente
   * de respaldo. Sin esta prop no se renderiza el botón.
   */
  onRemove?: () => void;
  /** `"video"` cambia el `accept`, los textos y la miniatura (`<video>` en vez de `<img>`). Default `"image"`. */
  mediaType?: "image" | "video";
  /** Muestra un campo "…o pegá una URL pública" debajo del botón de subida. */
  allowUrlPaste?: boolean;
}

const COPY = {
  image: { upload: "Subir imagen", change: "Cambiar imagen", remove: "Quitar imagen", accept: "image/*" },
  video: { upload: "Subir video", change: "Cambiar video", remove: "Quitar video", accept: "video/mp4,video/webm" },
} as const;

/**
 * ImageUploader — Éter, Iteración 14 ("La Forja Oculta"). Único punto del
 * panel admin que habla directo con Supabase Storage — cualquier form que
 * necesite subir una imagen (Quest, capítulos de caso de estudio, avatar
 * del Character Sheet) reutiliza este componente en vez de reimplementar
 * la subida.
 *
 * Iteración 39: además de subir, ahora puede (opt-in, por props) mostrar
 * la media actual (`value`), quitarla (`onRemove`), aceptar una URL
 * pegada (`allowUrlPaste`) y trabajar con video (`mediaType="video"`,
 * usado por el `heroVideoUrl` del Scroll-Bound Hero de las Quests).
 *
 * Path de subida: `<folder>/<timestamp>-<filename-sanitizado>` — evita
 * colisiones sin depender de que el usuario suba nombres únicos.
 *
 * Nunca lanza (`onUploadComplete` sólo se llama en éxito): cualquier error
 * de red o de Supabase se muestra inline con `role="alert"` y deja el
 * input listo para reintentar.
 */
export function ImageUploader({
  onUploadComplete,
  folder = "uploads",
  className,
  value,
  onRemove,
  mediaType = "image",
  allowUrlPaste = false,
}: ImageUploaderProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pastedUrl, setPastedUrl] = useState("");
  const inputId = useId();
  const pasteId = useId();
  const copy = COPY[mediaType];
  const hasValue = Boolean(value && value.trim().length > 0);

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
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });

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
          : `No se pudo subir el ${mediaType === "video" ? "video" : "archivo"}. Probá de nuevo.`
      );
    } finally {
      // Permite volver a elegir el mismo archivo si hizo falta reintentar.
      event.target.value = "";
    }
  }

  function handleUsePastedUrl() {
    const url = pastedUrl.trim();
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
    } catch {
      setStatus("error");
      setErrorMessage("Pegá una URL pública válida (https://…).");
      return;
    }
    setStatus("idle");
    setErrorMessage(null);
    setFileName(null);
    setPastedUrl("");
    onUploadComplete(url);
  }

  function handleRemove() {
    setFileName(null);
    setPastedUrl("");
    setStatus("idle");
    setErrorMessage(null);
    onRemove?.();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Miniatura de la media actual (Iteración 39) — sólo si el form pasa `value`. */}
      {hasValue && (
        <div className="relative w-full max-w-xs overflow-hidden rounded-md border border-white/10 bg-obsidian/60">
          {mediaType === "video" ? (
            <video
              src={value ?? undefined}
              muted
              playsInline
              controls
              preload="metadata"
              className="aspect-video w-full object-cover"
            />
          ) : (
            // Preview del CMS: `<img>` plano a propósito — `next/image` exige
            // que el host esté en `remotePatterns`, y una URL pegada puede
            // venir de cualquier dominio.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value ?? undefined} alt="Vista previa" className="aspect-video w-full object-cover" />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-parchment-muted transition-colors duration-150",
            "hover:border-gold-glow/50 hover:text-parchment",
            // Focus visible en el label cuando el input (sr-only) recibe foco por teclado.
            "has-[+input:focus-visible]:outline has-[+input:focus-visible]:outline-2 has-[+input:focus-visible]:outline-focus-ring",
            status === "uploading" && "pointer-events-none opacity-60"
          )}
        >
          {status === "uploading" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          {status === "uploading" ? "Subiendo…" : hasValue || fileName ? copy.change : copy.upload}
        </label>
        <input
          id={inputId}
          type="file"
          accept={copy.accept}
          onChange={handleFileChange}
          disabled={status === "uploading"}
          className="sr-only"
        />

        {hasValue && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={status === "uploading"}
            className="inline-flex w-fit items-center gap-1.5 rounded-md border border-danger/30 px-3 py-2.5 text-sm text-danger/90 transition-colors duration-150 hover:border-danger/60 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {copy.remove}
          </button>
        )}
      </div>

      {allowUrlPaste && (
        <div className="flex flex-col gap-1">
          <label htmlFor={pasteId} className="text-xs text-parchment-muted">
            …o pegá una URL pública
          </label>
          <div className="flex gap-2">
            <input
              id={pasteId}
              type="url"
              inputMode="url"
              value={pastedUrl}
              onChange={(event) => setPastedUrl(event.target.value)}
              onKeyDown={(event) => {
                // Enter acá NO debe someter todo el formulario de la Quest.
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleUsePastedUrl();
                }
              }}
              placeholder={mediaType === "video" ? "https://…/intro.mp4" : "https://…/imagen.webp"}
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50"
            />
            <button
              type="button"
              onClick={handleUsePastedUrl}
              disabled={pastedUrl.trim().length === 0}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-sm text-parchment-muted transition-colors duration-150 hover:border-gold-glow/50 hover:text-parchment disabled:opacity-40"
            >
              <Link2 className="h-4 w-4" aria-hidden />
              Usar URL
            </button>
          </div>
        </div>
      )}

      {hasValue ? (
        <p className="break-all text-xs text-parchment-muted/70">{value}</p>
      ) : (
        fileName && status !== "error" && <p className="text-xs text-parchment-muted/70">{fileName}</p>
      )}
      {status === "error" && errorMessage && (
        <p role="alert" className="text-xs text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
