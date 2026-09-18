"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * CustomCursor — Iteración 8 (Hefesto). Punto luminoso que sigue el mouse
 * con `mix-blend-mode: exclusion` (invierte el color que tiene debajo,
 * efecto "luz mágica" coherente con el resto del sistema) y se expande al
 * pasar sobre un elemento interactivo.
 *
 * Accesibilidad (HADES):
 *  - Se activa SÓLO tras confirmar `matchMedia("(pointer: fine)")` en el
 *    cliente — nunca se oculta el cursor nativo de forma incondicional vía
 *    CSS global. Un dispositivo táctil, un trackpad detectado como coarse,
 *    o cualquier entorno sin mouse preciso conserva el cursor del sistema
 *    intacto y este componente ni siquiera monta su listener.
 *  - `aria-hidden` — es 100% decorativo, no debe entrar al árbol de
 *    accesibilidad ni robar foco.
 *  - No reemplaza el `:focus-visible` del proyecto: la navegación por
 *    teclado sigue dependiendo exclusivamente del anillo de foco dorado
 *    definido en `globals.css`, este cursor no participa en absoluto de esa
 *    interacción (nunca se mueve por Tab, sólo por `pointermove`).
 *
 * Rendimiento (HADES): usa `useMotionValue` + `useSpring` (motion values,
 * no `useState`) para actualizar la posición en cada frame sin pasar por el
 * ciclo de render de React — el mismo patrón ya establecido en `Card.tsx`
 * para el spotlight que sigue el cursor.
 */
/**
 * Suscripción a `matchMedia("(pointer: fine)")` vía `useSyncExternalStore`
 * (HADES, auditoría 2026-09-15 — reemplaza el intento anterior con
 * `useState` + lazy initializer, que causaba el `Hydration failed` real de
 * la auditoría: el initializer leía `window` también en el primer render
 * de CLIENTE, no sólo en efectos post-montaje, así que en cualquier
 * desktop con mouse el cliente pintaba el cursor un paso antes que el
 * servidor). `useSyncExternalStore` es la API pensada exactamente para
 * esto — estado externo mutable, no reactivo de React — y resuelve las
 * dos cosas a la vez: `getServerSnapshot` fija `false` para el render de
 * servidor Y para el primer render de cliente (hidratación sin mismatch),
 * y React re-sincroniza solo después de montar, sin pasar por un
 * `setState` manual dentro de un `useEffect`.
 */
function useHasFinePointer() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(pointer: fine)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => false
  );
}

export function CustomCursor() {
  const enabled = useHasFinePointer();
  const [isHovering, setIsHovering] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { damping: 28, stiffness: 420, mass: 0.4 });
  const springY = useSpring(cursorY, { damping: 28, stiffness: 420, mass: 0.4 });

  useEffect(() => {
    if (!enabled) return;

    function handlePointerMove(event: PointerEvent) {
      cursorX.set(event.clientX);
      cursorY.set(event.clientY);
    }

    // Delegación de eventos a nivel documento — un solo listener detecta
    // hover sobre CUALQUIER elemento interactivo actual o futuro (no hace
    // falta marcar cada botón/link a mano con una prop o clase especial).
    function handlePointerOver(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (target.closest('a, button, [role="button"], input, textarea, select')) {
        setIsHovering(true);
      }
    }

    function handlePointerOut(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (target.closest('a, button, [role="button"], input, textarea, select')) {
        setIsHovering(false);
      }
    }

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointerout", handlePointerOut);
    document.body.classList.add("custom-cursor-active");

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      document.body.classList.remove("custom-cursor-active");
    };
  }, [enabled, cursorX, cursorY]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] rounded-full mix-blend-exclusion print:hidden"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        backgroundColor: "#ffffff",
      }}
      animate={{
        width: isHovering ? 44 : 10,
        height: isHovering ? 44 : 10,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    />
  );
}
