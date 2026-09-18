"use client";

/**
 * Bloqueo de scroll del body con conteo de referencias — Minerva,
 * Iteración 30 ("Fix de Modales, Impresión Dual y OG Dinámico").
 *
 * Bug que resuelve: `useDialogPanel` bloqueaba el scroll guardando
 * `document.body.style.overflow` al abrir y RESTAURÁNDOLO al cerrar —
 * perfecto para un solo panel a la vez, pero con dos paneles solapados
 * (p.ej. la Command Palette abre el `AchievementsDrawer` y se cierra a sí
 * misma en el mismo click, vía `runAndClose`) cada instancia capturaba y
 * restauraba esa propiedad global de forma independiente. Secuencia real
 * del bug: la Paleta captura `""` al abrir → el Drawer captura `"hidden"`
 * (ya seteado por la Paleta) al abrir → la Paleta se cierra y restaura
 * `""` (con el Drawer TODAVÍA abierto — el scroll vuelve antes de tiempo)
 * → el visitante cierra el Drawer, que restaura `"hidden"` (lo que había
 * capturado) → el body queda bloqueado PARA SIEMPRE, ya no queda ningún
 * panel abierto que lo libere.
 *
 * La causa raíz es que dos "snapshots" independientes de una única
 * propiedad global no componen. La solución estándar (y la que sugiere
 * el pedido: "contar los modales activos"): un contador de referencias a
 * nivel de módulo — cada panel que se abre suma 1 y sólo el que hace
 * bajar el contador a 0 restaura el valor original, capturado UNA sola
 * vez por el primer panel en abrir. `useDialogPanel` (y por lo tanto
 * TODO panel del sitio — `MobileMenu`, `ConfirmDialog`,
 * `AchievementsDrawer`, `ChapterMediaFrame`, `CommandPalette`) usa este
 * módulo en vez de tocar `document.body.style.overflow` directamente.
 */
let activeLocks = 0;
let previousOverflow = "";

export function acquireScrollLock() {
  if (activeLocks === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  activeLocks += 1;
}

export function releaseScrollLock() {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0) {
    document.body.style.overflow = previousOverflow;
  }
}
