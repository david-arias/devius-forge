# Deméter — Datos & Persistencia

Dominio exclusivo de Deméter. Modelado de datos, validación de esquemas y acceso a la fuente de datos del portafolio (proyectos/quests, experiencia/skill-tree, items/tecnologías).

- `schemas/` — Esquemas de validación (zod) para Quest, SkillNode, InventoryItem, Character, Navigation, Achievement, etc.
- `queries/` — Funciones puras de lectura/escritura de datos (CMS headless, JSON local, o base de datos futura). Ningún componente de Hefesto debe importar esto directamente: pasa por Minerva (hooks/servicios) o por Server Components de `app/`.

Regla de oro: si el proyecto migra de contenido estático (JSON/MDX) a una base de datos real, sólo este dominio debe cambiar.

## Patrón de repositorio (Iteración 10 — preparación CMS)

Cada archivo de `queries/` sigue el mismo patrón de dos capas:

1. **`fetchXFromSource(): Promise<unknown>`** — la fuente real de datos. Hoy
   devuelve un array/objeto estático embebido en el archivo; el día que se
   conecte un CMS (Sanity, Supabase, etc.), **este es el único código que
   cambia** — cada archivo tiene un comentario `TODO: Integrar CMS aquí` con
   ejemplos concretos de ambos proveedores. Devuelve `unknown` a propósito:
   fuerza a que el paso 2 sea quien garantice el tipo, igual que pasaría con
   JSON real de un CMS externo.
2. **`getX(): Promise<X>`** — la función pública del dominio (la que ya
   consumen Minerva y, por Minerva, Hefesto). Valida lo que devuelve
   `fetchXFromSource` con `XSchema.parse(...)` (o `XSchema.array().parse(...)`)
   antes de exponerlo. Si el CMS entrega un campo faltante o mal tipeado, la
   app falla temprano con un mensaje de Zod claro, en vez de romper
   silenciosamente un componente de Hefesto tres capas más arriba.

La firma pública (`getX(): Promise<X>`) nunca cambia entre las dos capas —
es justamente lo que permite migrar la fuente de datos sin tocar ni Minerva
ni Hefesto.
