"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, ExternalLink, FileQuestion, Film, ImageIcon, Link2, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { ConfirmDialog, SearchInput } from "@/components/hefesto/ui";
import { deleteMediaAction } from "@/lib/minerva/actions/media-actions";
import { useAdminToastStore } from "@/lib/minerva/admin-toast-store";
// `import type` (no `{ type … }`): garantiza que el módulo server-only
// `storage.ts` (usa `next/headers`) jamás entre al bundle del cliente.
import type { StorageFile } from "@/lib/demeter/queries/storage";
import { cn } from "@/lib/utils";

interface MediaVaultProps {
  files: StorageFile[];
  /** `path → ["Quest: …", …]` — ver `getStorageUsage()` (Deméter). */
  usage: Record<string, string[]>;
}

type Filter = "all" | "image" | "video" | "unused";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "image", label: "Imágenes" },
  { key: "video", label: "Videos" },
  { key: "unused", label: "Sin usar" },
];

const dateFmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" });

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * MediaVault — "La Bóveda" (Hefesto/Minerva, Iteración 40). Galería
 * masonry (CSS `columns`, sin librería: cada tarjeta respeta la
 * proporción real de su imagen) de TODO el bucket `quest-images`.
 *
 *  - Miniaturas `<img loading="lazy">` planas a propósito: `next/image`
 *    pasaría cada una por el optimizador de Vercel (cuota) sólo para un
 *    panel privado.
 *  - Videos: primer frame (`#t=0.1` + `preload="metadata"`) y un sello
 *    "VIDEO" — nunca se reproducen solos.
 *  - Acciones por tarjeta (Copiar URL / Abrir / Eliminar): visibles
 *    siempre en touch; en desktop aparecen en hover **y** en
 *    `focus-within` (navegables por teclado).
 *  - "En uso por…" (dorado) sale de `getStorageUsage()`: el modal de
 *    confirmación lo repite en rojo, porque borrar un archivo en uso deja
 *    esa Quest con la imagen rota (la referencia en la base NO se limpia
 *    sola — para eso está "Quitar imagen" en el formulario de la Quest).
 *  - Borrado optimista: la tarjeta desaparece al confirmar y vuelve si
 *    el Server Action falla.
 */
export function MediaVault({ files: initialFiles, usage }: MediaVaultProps) {
  const [files, setFiles] = useState(initialFiles);
  const [prevInitial, setPrevInitial] = useState(initialFiles);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingDelete, setPendingDelete] = useState<StorageFile | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pushToast = useAdminToastStore((state) => state.push);
  const reduce = useReducedMotion();

  // Si el servidor re-renderiza con otra lista (revalidatePath tras
  // borrar/subir), se adopta — patrón "ajustar estado cuando cambian las
  // props" de la doc de React, sin useEffect.
  if (initialFiles !== prevInitial) {
    setPrevInitial(initialFiles);
    setFiles(initialFiles);
  }

  const trimmed = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      files.filter((file) => {
        if (filter === "unused" && usage[file.path]?.length) return false;
        if ((filter === "image" || filter === "video") && file.kind !== filter) return false;
        return trimmed.length === 0 || file.path.toLowerCase().includes(trimmed);
      }),
    [files, filter, trimmed, usage]
  );

  const totalBytes = useMemo(() => files.reduce((sum, file) => sum + (file.size ?? 0), 0), [files]);

  async function handleCopy(file: StorageFile) {
    try {
      await navigator.clipboard.writeText(file.url);
      setCopiedPath(file.path);
      window.setTimeout(() => setCopiedPath((current) => (current === file.path ? null : current)), 1800);
    } catch {
      pushToast("error", "No se pudo copiar — el navegador bloqueó el portapapeles.");
    }
  }

  function handleConfirmDelete() {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);
    setFiles((current) => current.filter((file) => file.path !== target.path));

    startTransition(async () => {
      const result = await deleteMediaAction(target.path);
      if (result.status === "error") {
        // Rollback: la tarjeta vuelve a su lugar.
        setFiles((current) =>
          current.some((file) => file.path === target.path)
            ? current
            : [...current, target].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        );
      }
      if (result.message) pushToast(result.status === "error" ? "error" : "success", result.message);
    });
  }

  const pendingUsage = pendingDelete ? usage[pendingDelete.path] ?? [] : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filtrar archivos" className="flex flex-wrap gap-1 rounded-lg border border-white/10 bg-obsidian/60 p-1 text-xs font-semibold">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors duration-150",
                filter === key ? "bg-emerald-glow/20 text-emerald-glow" : "text-parchment-muted hover:text-parchment"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-parchment-muted" aria-live="polite">
          {visible.length} de {files.length} archivos · {formatBytes(totalBytes)} en total
        </p>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar por nombre o carpeta (ej. el-bazar/chapters)…"
        aria-label="Buscar archivos por nombre o carpeta"
      />

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-white/10 px-4 py-10 text-center text-sm text-parchment-muted">
          {files.length === 0 ? "La Bóveda está vacía — todavía no subiste ningún archivo." : "Ningún archivo coincide con el filtro."}
        </p>
      ) : (
        <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 2xl:columns-4">
          <AnimatePresence initial={false}>
            {visible.map((file) => {
              const usedBy = usage[file.path] ?? [];
              const copied = copiedPath === file.path;

              return (
                <motion.li
                  key={file.path}
                  initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border border-white/10 bg-carbon/70 focus-within:border-gold-glow/40"
                >
                  {/* Miniatura */}
                  <div className="relative bg-[conic-gradient(#1a1a24_25%,#12121a_0_50%,#1a1a24_0_75%,#12121a_0)] bg-[length:16px_16px]">
                    {file.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.url} alt={file.name} loading="lazy" decoding="async" className="block h-auto w-full" />
                    ) : file.kind === "video" ? (
                      <video
                        src={`${file.url}#t=0.1`}
                        preload="metadata"
                        muted
                        playsInline
                        aria-label={`Video ${file.name}`}
                        className="block aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center text-parchment-muted/60">
                        <FileQuestion className="h-8 w-8" aria-hidden />
                      </div>
                    )}

                    {/* Sello de tipo */}
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-obsidian/80 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-parchment backdrop-blur">
                      {file.kind === "video" ? (
                        <>
                          <Film className="h-3 w-3 text-neon" aria-hidden /> Video
                        </>
                      ) : file.kind === "image" ? (
                        <>
                          <ImageIcon className="h-3 w-3 text-emerald-glow" aria-hidden /> Imagen
                        </>
                      ) : (
                        "Archivo"
                      )}
                    </span>

                    {/* Acciones superpuestas */}
                    <div className="absolute right-2 top-2 flex gap-1.5 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleCopy(file)}
                        aria-label={copied ? `URL de ${file.name} copiada` : `Copiar URL de ${file.name}`}
                        title="Copiar URL"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-obsidian/85 text-parchment backdrop-blur transition-colors hover:border-emerald-glow/60 hover:text-emerald-glow"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-glow" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Abrir ${file.name} en una pestaña nueva`}
                        title="Abrir"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-obsidian/85 text-parchment backdrop-blur transition-colors hover:border-gold-glow/60 hover:text-gold-glow"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(file)}
                        disabled={isPending}
                        aria-label={`Eliminar ${file.name}`}
                        title="Eliminar"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-danger/40 bg-obsidian/85 text-danger backdrop-blur transition-colors hover:bg-danger hover:text-obsidian disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>

                  {/* Ficha */}
                  <div className="flex flex-col gap-1.5 p-3">
                    <p className="break-all text-sm font-medium text-parchment">{file.name}</p>
                    <p className="break-all text-xs text-parchment-muted">
                      {file.folder || "/"} · {formatBytes(file.size)}
                      {file.createdAt && ` · ${dateFmt.format(new Date(file.createdAt))}`}
                    </p>
                    {usedBy.length > 0 ? (
                      <p className="flex items-start gap-1.5 text-xs text-gold-glow">
                        <Link2 className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                        <span>En uso: {usedBy.join(" · ")}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-parchment-muted/70">Sin referencias en el sitio</p>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`¿Eliminar "${pendingDelete?.name ?? ""}"?`}
        description="El archivo se borra físicamente del bucket de Supabase. Esta acción no se puede deshacer."
        confirmLabel="Eliminar archivo"
        pending={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        {pendingUsage.length > 0 && (
          <div role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-parchment">
            <p className="font-semibold text-danger">¡Este archivo está en uso!</p>
            <p className="mt-1 text-parchment-muted">
              Lo referencia: {pendingUsage.join(", ")}. Si lo borrás, esa sección mostrará una imagen/video roto hasta
              que lo reemplaces o uses &quot;Quitar imagen&quot; en su formulario.
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
