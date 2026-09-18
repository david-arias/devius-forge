import { z } from "zod";

/** NavLink = ancla interna del Navbar. Dominio Deméter. */
export const NavLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

/** SocialLink = enlace externo (o mailto) del Navbar/Footer. Dominio Deméter. */
export const SocialLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  kind: z.enum(["github", "linkedin", "email"]),
});

export const NavigationSchema = z.object({
  navLinks: z.array(NavLinkSchema),
  socialLinks: z.array(SocialLinkSchema),
});

export type NavLink = z.infer<typeof NavLinkSchema>;
export type SocialLink = z.infer<typeof SocialLinkSchema>;
export type Navigation = z.infer<typeof NavigationSchema>;
