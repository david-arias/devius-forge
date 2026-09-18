/**
 * `loading.tsx` del segmento `(admin)/(protected)` — Minerva, Iteración 16
 * ("CMS V2", auditoría 2026-09-16, Hallazgo de Alto Impacto: "no hay
 * ningún esqueleto de carga ni transición visual... la pantalla se queda
 * igual y de golpe cambia", 600ms-1.5s medidos por transición entre
 * secciones). Next.js envuelve automáticamente el segmento en un
 * `<Suspense>` con esto como `fallback` — un solo archivo acá cubre las
 * 4 secciones (`/admin/quests`, `/admin/character`, `/admin/skills`,
 * `/admin/inventory`) y el dashboard (`/admin`), en vez de 5 copias
 * casi idénticas por ruta.
 *
 * No sabe qué página está cargando (Next no le pasa esa información), así
 * que el esqueleto es genérico a propósito: un título + un puñado de
 * "cartas" con líneas de distinto ancho, con la MISMA forma que `Card`
 * (`rounded-xl`, `bg-white/[0.03]`, `p-6`/`p-7`) para que la transición de
 * esqueleto → contenido real no salte de tamaño. Sirve tanto para el
 * grid de 4 tarjetas del dashboard como para la lista de formularios de
 * Quests/Skills/Inventory/Character.
 *
 * `aria-hidden` + `role="status"`/`aria-live="polite"` en el contenedor:
 * un lector de pantalla anuncia "Cargando…" una sola vez en vez de leer
 * cada bloque gris individualmente.
 */
export default function AdminLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8" role="status" aria-live="polite">
      <span className="sr-only">Cargando…</span>

      <div aria-hidden className="flex flex-col gap-2">
        <div className="h-7 w-40 animate-pulse rounded-md bg-white/10" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-white/[0.06]" />
      </div>

      {[0, 1, 2].map((i) => (
        <div
          key={i}
          aria-hidden
          className="animate-pulse rounded-xl border border-white/5 bg-white/[0.03] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:p-7"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="h-5 w-32 rounded-md bg-white/10" />
            <div className="h-8 w-8 rounded-md bg-white/[0.06]" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="h-9 w-full rounded-md bg-white/[0.06]" />
            <div className="h-9 w-full rounded-md bg-white/[0.06]" />
            <div className="h-20 w-full rounded-md bg-white/[0.06]" />
            <div className="h-9 w-2/3 rounded-md bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
