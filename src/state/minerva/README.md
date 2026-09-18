# Minerva — Rutas, Estado & Lógica de Negocio

Dominio exclusivo de Minerva. Orquesta el flujo entre datos (Deméter) y presentación (Hefesto).

- `state/minerva/` — Stores de Zustand (ej. `useUiStore` para modales/tema, `useQuestFilterStore` para filtros de proyectos).
- `lib/minerva/` — Hooks y servicios que exponen datos ya transformados a los componentes (`getQuestsForView()`, `getSkillTreeForView()`), consumiendo internamente `lib/demeter`.
- `app/` (Next.js App Router) — Estructura de rutas, layouts, loading/error boundaries y guards de navegación también son responsabilidad de Minerva, aunque vivan en la carpeta especial `src/app` que exige Next.js.

Regla de oro: los componentes de Hefesto sólo hablan con hooks de Minerva, nunca con Deméter directamente.
