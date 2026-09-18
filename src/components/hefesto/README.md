# Hefesto — UI/UX & Design System

Dominio exclusivo de Hefesto. Aquí viven todos los componentes visuales puros (presentacionales), sin lógica de negocio ni fetching de datos.

- `ui/` — Átomos y moléculas del sistema de diseño: Button, Card (Inventory Item), Modal, Badge, Tooltip, FocusRing wrapper, etc. Deben ser consumidos por MASTER.md como fuente de verdad.
- `sections/` — Composiciones de secciones de página (CharacterSheet, QuestGrid, SkillTree, Inventory) que combinan componentes de `ui/` con datos recibidos vía props — nunca importan directamente de `lib/demeter` ni de `state/minerva`.

Reglas:
1. Contraste mínimo 4.5:1 en todo texto sobre fondo oscuro (Obsidiana/Carbón).
2. Todo elemento interactivo debe tener un `focus-visible` ring visible.
3. Animaciones vía Framer Motion, respetando `prefers-reduced-motion`.
4. Ningún componente aquí debe hacer `fetch`, leer `zustand` stores directamente, ni conocer rutas — reciben todo por props o children.
