/**
 * Estado compartido de todos los Server Actions del CMS (Minerva,
 * Iteración 15). Forma mínima compatible con `useActionState` de React 19:
 * cada acción de `quest-actions.ts`/`skill-actions.ts`/`inventory-actions.ts`/
 * `character-actions.ts` devuelve uno de estos, y cada `*Form.tsx` lo
 * escucha con un `useEffect` para disparar el Toast (`AdminToastHost`,
 * Hefesto) correspondiente — un único patrón para "éxito"/"error" en los
 * 4 formularios en vez de reinventarlo por entidad.
 */
export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialActionState: ActionState = { status: "idle" };

/** Envuelve cualquier throw de una mutación de Deméter en un `ActionState` de error, con mensaje legible en vez de un stack trace crudo llegando al Toast. */
export function toErrorState(err: unknown, fallback: string): ActionState {
  return { status: "error", message: err instanceof Error ? err.message : fallback };
}
