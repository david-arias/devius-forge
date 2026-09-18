import Link from "next/link";
import { type Navigation } from "@/lib/demeter/schemas";
import { ArrowUpRight } from "lucide-react";
import {
  AchievementScrollTrigger,
  ContactForm,
  FooterContactActions,
  RevealText,
} from "@/components/hefesto/ui";

interface FooterProps {
  navigation: Navigation;
}

/**
 * Footer — Iteración 21 ("Footer Inmersivo", Hefesto). Pasa de un bloque
 * de botones a un cierre de dos columnas:
 *   - izquierda: titular revelado en cascada, correo directo y redes;
 *   - derecha: `ContactForm` real (Supabase `public.messages`) dentro de
 *     una carta de vidrio con halo.
 * Debajo, una firma gigante "DEVIUS" recortada por el borde inferior
 * (cierre editorial, puramente decorativo).
 *
 * Sigue siendo Server Component: sus piezas interactivas
 * (`ContactForm`, `FooterContactActions`, `AchievementScrollTrigger`,
 * `RevealText`) son hijos `"use client"`.
 */
export function Footer({ navigation }: FooterProps) {
  const emailLink = navigation.socialLinks.find((link) => link.kind === "email");
  const rawEmail = emailLink?.href.replace(/^mailto:/, "");
  const year = new Date().getFullYear();

  return (
    <footer id="contacto" className="relative scroll-mt-20 overflow-hidden border-t border-white/10 print:hidden">
      <AchievementScrollTrigger achievementId="forge-explorer" />

      {/* Halo de la forja */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[60rem] -translate-x-1/2 rounded-full bg-gold-glow/[0.07] blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-14 px-4 pb-10 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-12 lg:gap-10">
        {/* Columna izquierda */}
        <div className="flex flex-col lg:col-span-5">
          <p className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-emerald-glow">
            <span className="tabular-nums text-parchment-muted">06</span>
            <span aria-hidden className="h-px w-8 bg-emerald-glow/50" />
            Contacto
          </p>
          <RevealText
            as="h2"
            trigger="inView"
            text={"Hablemos de tu\npróxima Quest"}
            split="lines"
            className="font-display text-4xl leading-[1.05] text-parchment sm:text-5xl"
          />
          <p className="mt-6 max-w-sm leading-relaxed text-parchment/60">
            ¿Un producto que necesita diseño y código en la misma mano? Contame la idea — la forja está
            encendida.
          </p>

          {emailLink && rawEmail && (
            <a
              href={emailLink.href}
              className="group mt-10 inline-flex w-fit items-center gap-2 border-b border-white/15 pb-1 font-display text-xl text-parchment transition-colors hover:border-gold-glow hover:text-gold-glow sm:text-2xl"
            >
              {rawEmail}
              <ArrowUpRight
                className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </a>
          )}

          <div className="mt-8 [&>div]:mt-0 [&>div]:justify-start">
            <FooterContactActions socialLinks={navigation.socialLinks} />
          </div>
        </div>

        {/* Columna derecha — formulario */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl border border-white/10 bg-obsidian-soft/60 p-6 shadow-[0_40px_120px_-40px_rgba(232,196,104,0.18)] backdrop-blur-xl sm:p-8">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-gold-glow/60 to-transparent"
            />
            <h3 className="mb-6 font-display text-lg text-parchment">Enviar un pergamino</h3>
            <ContactForm />
          </div>
        </div>
      </div>

      {/* Firma gigante + créditos */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-2 border-t border-white/10 py-6 text-xs text-parchment-muted/75 sm:flex-row sm:items-center">
          <p>© {year} Devius — forjado con Next.js, Tailwind CSS y Framer Motion.</p>
          <Link href="/#home" className="rounded px-1 transition-colors hover:text-parchment">
            Volver arriba ↑
          </Link>
        </div>
      </div>
      <p
        aria-hidden
        className="pointer-events-none -mb-[0.22em] select-none text-center font-display text-[22vw] font-black leading-none tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_rgba(233,230,223,0.08)]"
      >
        DEVIUS
      </p>
    </footer>
  );
}
