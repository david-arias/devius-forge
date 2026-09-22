import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QUEST_IMAGES_BUCKET } from "@/lib/supabase/client";

/**
 * Adaptador de Supabase Storage — Deméter/Minerva, Iteración 40 ("Control
 * Total"). Único lugar del servidor que LISTA y BORRA archivos del bucket
 * `quest-images` (la SUBIDA sigue viviendo en `ImageUploader`, del lado
 * del cliente, desde la Iteración 14).
 *
 * Igual que `*.mutations.ts`: usa `createServerSupabaseClient()`
 * (`next/headers`), así que SÓLO lo importan Server Components de
 * `/admin/*` y Server Actions (`media-actions.ts`, `quest-actions.ts`) —
 * nunca un archivo `"use client"`, y nunca se re-exporta desde
 * `queries/index.ts`.
 *
 * Permisos: todo pasa por RLS como el usuario autenticado del panel.
 * `001_init.sql` ya define lectura pública (`select`) y borrado sólo
 * autenticado (`delete`) sobre `storage.objects` para este bucket — no
 * hace falta ninguna migración nueva.
 */

export type StorageFileKind = "image" | "video" | "other";

export interface StorageFile {
  /** Nombre del archivo (último segmento del path). */
  name: string;
  /** Path completo dentro del bucket, p.ej. `el-bazar/cover/1726-foo.webp`. */
  path: string;
  /** Carpeta contenedora (`""` = raíz del bucket). */
  folder: string;
  /** URL pública lista para pegar en el CMS. */
  url: string;
  /** Bytes — `null` si Supabase no devolvió metadata. */
  size: number | null;
  mimeType: string | null;
  kind: StorageFileKind;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Profundidad máxima de carpetas a recorrer (hoy la más honda es `<quest>/chapters/<capítulo>` = 3). */
const MAX_DEPTH = 6;
/** Tamaño de página de `storage.list()` (máximo que acepta la API). */
const PAGE_SIZE = 1000;
/** Supabase crea este archivo fantasma al crear una carpeta vacía desde el dashboard. */
const PLACEHOLDER_FILE = ".emptyFolderPlaceholder";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg)$/i;

function detectKind(name: string, mimeType: string | null): StorageFileKind {
  if (mimeType?.startsWith("video/") || VIDEO_EXT.test(name)) return "video";
  if (mimeType?.startsWith("image/") || IMAGE_EXT.test(name)) return "image";
  return "other";
}

/**
 * Normaliza y valida un path/carpeta del bucket. Rechaza `..` y paths
 * absolutos: el path llega desde el cliente (Server Action), así que se
 * trata como input no confiable aunque sólo un admin pueda llamarlo.
 */
export function normalizeStoragePath(raw: string): string {
  const path = raw.trim().replace(/^\/+|\/+$/g, "");
  if (path.split("/").some((segment) => segment === ".." || segment === ".")) {
    throw new Error("Path de archivo inválido.");
  }
  return path;
}

/**
 * Lista los archivos de una carpeta del bucket (`""` = todo el bucket).
 * `storage.list()` de Supabase NO es recursivo — devuelve archivos y
 * "carpetas" (entradas sin `id`) de un solo nivel —, así que se recorre
 * el árbol a mano, en paralelo por nivel, paginando de a 1000.
 *
 * Devuelve los archivos del más nuevo al más viejo.
 */
export async function listStorageFiles(
  folder = "",
  options: { recursive?: boolean } = {}
): Promise<StorageFile[]> {
  const recursive = options.recursive ?? true;
  const supabase = await createServerSupabaseClient();
  const bucket = supabase.storage.from(QUEST_IMAGES_BUCKET);
  const files: StorageFile[] = [];

  async function walk(prefix: string, depth: number): Promise<void> {
    const subfolders: string[] = [];

    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await bucket.list(prefix, {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(`No se pudo listar "${prefix || "/"}": ${error.message}`);
      if (!data || data.length === 0) break;

      for (const entry of data) {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        // Las "carpetas" vienen sin `id` (y sin metadata) — el tipo de
        // supabase-js dice `string`, pero en runtime es `null`.
        if (!entry.id) {
          subfolders.push(path);
          continue;
        }
        if (entry.name === PLACEHOLDER_FILE) continue;

        const metadata = (entry.metadata ?? {}) as { size?: number; mimetype?: string };
        const mimeType = metadata.mimetype ?? null;
        files.push({
          name: entry.name,
          path,
          folder: prefix,
          url: bucket.getPublicUrl(path).data.publicUrl,
          size: typeof metadata.size === "number" ? metadata.size : null,
          mimeType,
          kind: detectKind(entry.name, mimeType),
          createdAt: entry.created_at ?? null,
          updatedAt: entry.updated_at ?? null,
        });
      }

      if (data.length < PAGE_SIZE) break;
    }

    if (recursive && depth < MAX_DEPTH) {
      await Promise.all(subfolders.map((sub) => walk(sub, depth + 1)));
    }
  }

  await walk(normalizeStoragePath(folder), 0);

  return files.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/**
 * Borra UN archivo físicamente del bucket. Supabase no devuelve error si
 * el archivo no existe o si RLS bloqueó el borrado — sólo un array vacío —,
 * así que eso se convierte en error explícito acá.
 */
export async function deleteStorageFile(rawPath: string): Promise<void> {
  const path = normalizeStoragePath(rawPath);
  if (!path) throw new Error("Falta el path del archivo a eliminar.");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.storage.from(QUEST_IMAGES_BUCKET).remove([path]);

  if (error) throw new Error(`No se pudo eliminar el archivo: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("El archivo no existe o tu sesión no tiene permiso para borrarlo.");
  }
}

/**
 * Borra TODOS los archivos bajo una carpeta (recursivo) — lo usa
 * `deleteQuestAction` cuando el editor marca "borrar también sus
 * archivos" (`<quest-id>/cover`, `/chapters/*`, `/hero-video`).
 * Devuelve cuántos archivos se borraron. Nunca acepta la raíz del bucket.
 *
 * `skipInUse` (default `true`): antes de borrar, se consulta
 * `getStorageUsage()` y se CONSERVA todo archivo que otra fila siga
 * referenciando — p.ej. una Quest creada con "Duplicar", que copia las
 * URLs del original (apuntan a la carpeta del original). Por eso
 * `deleteQuestAction` llama a esto DESPUÉS de borrar la fila: lo que
 * queda referenciado es, por definición, de otra Quest.
 */
export async function deleteStorageFolder(
  rawFolder: string,
  options: { skipInUse?: boolean } = {}
): Promise<number> {
  const folder = normalizeStoragePath(rawFolder);
  if (!folder) throw new Error("Por seguridad no se puede vaciar la raíz del bucket.");

  let files = await listStorageFiles(folder);
  if (options.skipInUse ?? true) {
    const usage = await getStorageUsage(files.map((file) => file.path));
    files = files.filter((file) => !usage[file.path]?.length);
  }
  if (files.length === 0) return 0;

  const supabase = await createServerSupabaseClient();
  const bucket = supabase.storage.from(QUEST_IMAGES_BUCKET);
  let removed = 0;
  // `remove()` acepta hasta 1000 paths por llamada.
  for (let i = 0; i < files.length; i += PAGE_SIZE) {
    const chunk = files.slice(i, i + PAGE_SIZE).map((file) => file.path);
    const { data, error } = await bucket.remove(chunk);
    if (error) throw new Error(`No se pudieron eliminar los archivos de "${folder}": ${error.message}`);
    removed += data?.length ?? 0;
  }
  return removed;
}

/**
 * ¿Dónde se usa cada archivo? — mapa `path → ["Quest: El Bazar", …]`.
 * Lee las filas crudas de las tablas que guardan URLs del bucket y busca
 * `/<bucket>/<path>` dentro de su JSON: cubre `media`, `hero_video_url`,
 * `case_study.chapter_media.*`, `character_sheet.hero_image_url` y
 * cualquier columna futura sin tener que enumerarlas acá. Si una tabla
 * falla (p.ej. todavía no existe), se ignora: esto es sólo una ayuda
 * visual para el Gestor de Archivos, nunca bloquea nada.
 */
export async function getStorageUsage(paths: string[]): Promise<Record<string, string[]>> {
  const usage: Record<string, string[]> = {};
  if (paths.length === 0) return usage;

  const supabase = await createServerSupabaseClient();
  const sources: { label: (row: Record<string, unknown>) => string; table: string }[] = [
    { table: "quests", label: (row) => `Quest: ${String(row.title ?? row.id)}` },
    { table: "character_sheet", label: () => "Character Sheet" },
    { table: "inventory", label: (row) => `Inventario: ${String(row.name ?? row.id)}` },
  ];

  const results = await Promise.all(
    sources.map(async (source) => {
      const { data, error } = await supabase.from(source.table).select("*");
      return error || !data ? [] : (data as Record<string, unknown>[]).map((row) => ({ source, row }));
    })
  );

  for (const { source, row } of results.flat()) {
    const json = JSON.stringify(row);
    for (const path of paths) {
      if (json.includes(`/${QUEST_IMAGES_BUCKET}/${path}`)) {
        (usage[path] ??= []).push(source.label(row));
      }
    }
  }
  return usage;
}
