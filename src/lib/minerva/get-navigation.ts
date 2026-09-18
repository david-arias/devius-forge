import { getNavigation as fetchNavigation } from "@/lib/demeter/queries/navigation";

/** Servicio de Minerva: expone la navegación (anclas + redes) ya lista para Hefesto. No es un React Hook. */
export async function getNavigationForView() {
  return fetchNavigation();
}
