import Link from "next/link";
import { TopBar } from "./TopBar";
import { SiteFooter } from "./SiteFooter";
import { Card } from "@/src/components/ui/Surface";
import type { FaqEntry } from "../content/industries";

type Crumb = { name: string; path: string };

type Props = {
  crumbs: Crumb[];
  title: string;
  intro: string;
  bullets: { title: string; detail: string }[];
  faqs: FaqEntry[];
  /** e.g. "Start selling free →" / "Post your first RFQ →" */
  ctaLabel: string;
  ctaHref: string;
};

/**
 * Shared shell for the role pages (/manufacturers, /suppliers, /traders,
 * /wholesalers, /distributors, /importers, /exporters, /buyers) and the
 * service pages (/services/[service]) — same visual structure
 * (breadcrumb, h1, intro, capability bullets, CTA, FAQ) with content supplied
 * per-page from src/features/marketing/content/{roles,services}.ts. JSON-LD
 * (Breadcrumb/FAQ) is built by the caller, not here, since it needs the
 * site-relative paths the caller already has.
 */
export const RolePageTemplate = ({ crumbs, title, intro, bullets, faqs, ctaLabel, ctaHref }: Props) => (
  <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
    <TopBar />
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "var(--medium-gray)" }}>
          {crumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {i === crumbs.length - 1 ? (
                <span style={{ color: "var(--foreground)" }}>{crumb.name}</span>
              ) : (
                <Link href={crumb.path} className="hover:underline">{crumb.name}</Link>
              )}
            </span>
          ))}
        </nav>

        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>{title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{intro}</p>

        <div className="mt-6">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
          >
            {ctaLabel}
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--foreground)" }}>What you can do on ARVANN</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {bullets.map((b) => (
              <Card key={b.title}>
                <p className="font-bold" style={{ color: "var(--foreground)" }}>{b.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>{b.detail}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--foreground)" }}>Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--foreground)" }}>{faq.question}</summary>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>
);
