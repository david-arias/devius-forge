import { z } from "zod";
import { InventoryItemSchema } from "@/lib/demeter/schemas";

/**
 * Schema de FORMULARIO para un ítem del Inventario — Minerva,
 * Iteración 14. A diferencia de `character-form-schema.ts`/
 * `skills-form-schema.ts`, acá SÍ se reutiliza `InventoryItemSchema`
 * (`src/lib/demeter/schemas/inventory-item.ts`) casi tal cual — su forma
 * ya es plana y 100% apta para un `<input>` por campo, sin ningún array
 * anidado que requiera una conversión textarea → string[]. Se re-declara
 * en vez de usar `InventoryItemSchema` directo sólo para poder adjuntar
 * mensajes de error en español por campo.
 */
export const InventoryFormSchema = z.object({
  id: z.string().min(1, "El id es obligatorio (slug único, p.ej. \"react\")."),
  name: z.string().min(1, "El nombre es obligatorio."),
  category: InventoryItemSchema.shape.category,
  // No se reusa `InventoryItemSchema.shape.rarity` tal cual: ese campo tiene
  // `.default("common")` en el dominio, lo que en Zod hace que el TIPO DE
  // ENTRADA (`z.input`) sea opcional — `zodResolver` de react-hook-form
  // necesita que el tipo de entrada y el tipo de salida (`z.output`)
  // coincidan exactamente, así que un campo opcional-por-default rompe la
  // inferencia del `Resolver`. Se redeclara sin `.default()` acá; el
  // `defaultValues` de `useForm` ya cubre el mismo propósito en el form.
  rarity: z.enum(["common", "rare", "legendary"]),
  // `z.number()` liso, no `z.coerce.number()`: coerce vuelve el tipo de
  // ENTRADA `unknown`, lo que rompe la inferencia del `Resolver` igual que
  // el problema de `rarity` arriba. El input HTML sigue siendo
  // `type="number"`; la conversión a número la hace `valueAsNumber: true`
  // en `register("level", ...)` del lado del componente, no acá.
  level: z
    .number()
    .min(0, "El nivel mínimo es 0.")
    .max(100, "El nivel máximo es 100."),
  /** Checkbox — mismo patrón que `SkillsFormSchema.unlocked`/`QuestFormSchema.isPublished` (Iteración 16, unifica "borrador" en todo el CMS). No se reusa `InventoryItemSchema.shape.isPublished` por el mismo motivo que `rarity` arriba (`.default(true)` rompe la inferencia del Resolver). */
  isPublished: z.boolean(),
});

export type InventoryFormValues = z.infer<typeof InventoryFormSchema>;

/** Convierte los valores validados del formulario a la forma de `InventoryItem` (Deméter). */
export function toInventoryItemInput(values: InventoryFormValues) {
  return values;
}
