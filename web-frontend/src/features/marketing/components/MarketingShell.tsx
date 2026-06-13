import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { SiteFooter } from "./SiteFooter";

/**
 * MarketingShell — wraps a public marketing/info page with the shared TopBar
 * and SiteFooter so About / Support / Contact match the landing page chrome.
 */
export const MarketingShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col" style={{ color: "var(--foreground)" }}>
    <TopBar />
    <main className="flex-1">{children}</main>
    <SiteFooter />
  </div>
);

/**
 * Shared hero band for info pages — keeps eyebrow/title/subtitle styling
 * consistent across About, Support, and Contact.
 */
export const MarketingHero = ({
  eyebrow,
  title,
  subtitle,
  badge,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: string;
}) => (
  <section className="relative overflow-hidden">
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: "linear-gradient(160deg, var(--primary-light) 0%, transparent 60%)" }}
    />
    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.07]"
      style={{ backgroundColor: "var(--primary)" }} />
    <div className="relative mx-auto w-full max-w-[1100px] px-6 pb-10 pt-16 text-center lg:px-10">
      {badge && (
        <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--primary)", boxShadow: "var(--shadow-sm)" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
          {badge}
        </span>
      )}
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.5em]" style={{ color: "var(--primary)" }}>
        {eyebrow}
      </p>
      <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-black leading-[1.1] md:text-5xl" style={{ color: "var(--foreground)" }}>
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: "var(--medium-gray)" }}>
        {subtitle}
      </p>
    </div>
  </section>
);
