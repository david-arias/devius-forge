import { NavigationSchema, type Navigation, type SocialLink } from "../schemas";
import { getSettings } from "./settings";

/**
 * Repositorio de Navigation (Deméter). Iteración 22: los enlaces sociales
 * ya NO están escritos a mano — se derivan de `public.global_settings`
 * (editable en `/admin/settings`) vía `getSettings()` (cacheado, tag
 * `"settings"`). Las anclas internas (`navLinks`) sí siguen en código:
 * son estructura de la página (ids de sección), no contenido.
 *
 * Un campo vacío en los ajustes = ese enlace no aparece en Navbar,
 * MobileMenu, Footer, Hero ni en el JSON-LD.
 */
// Iteración 23: "/#…" (no "#…") para que funcionen también desde /quests/*,
// el 404 y la pantalla de error. En la home el navegador lo resuelve como
// salto de ancla sin recargar.
const NAV_LINKS = [
  { label: "Quests", href: "/#quests" },
  { label: "Skill Tree", href: "/#skill-tree" },
  { label: "Inventario", href: "/#inventario" },
];

export async function getNavigation(): Promise<Navigation> {
  const settings = await getSettings();

  const socialLinks: SocialLink[] = [];
  if (settings.githubUrl) socialLinks.push({ label: "GitHub", href: settings.githubUrl, kind: "github" });
  if (settings.linkedinUrl) socialLinks.push({ label: "LinkedIn", href: settings.linkedinUrl, kind: "linkedin" });
  if (settings.email) socialLinks.push({ label: "Correo", href: `mailto:${settings.email}`, kind: "email" });

  return NavigationSchema.parse({ navLinks: NAV_LINKS, socialLinks });
}
