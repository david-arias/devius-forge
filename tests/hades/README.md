# HADES — Calidad & Testing (QA)

Dominio exclusivo de HADES. Ningún feature se considera "Done" sin cobertura aquí.

- `unit/` — Vitest + Testing Library para componentes de Hefesto (render, accesibilidad, estados) y funciones puras de Deméter/Minerva.
- `e2e/` — Playwright para flujos críticos: navegación entre Quests, apertura de modales de detalle, formulario de contacto, navegación por teclado completa.

Definition of Done: sin errores de consola, contraste validado, navegación por teclado funcional, sin regresiones visuales evidentes.
