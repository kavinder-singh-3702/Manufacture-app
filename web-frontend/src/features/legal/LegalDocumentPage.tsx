import Link from "next/link";
import { LegalDocumentContent } from "./legal-content";
import { LegalLinks } from "./LegalLinks";
import { SiteFooter } from "@/src/features/marketing/components/SiteFooter";
import { BrandWordmark } from "@/src/components/BrandLogo";
import {
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_MAILTO,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
} from "@/src/lib/contact";

type LegalDocumentPageProps = {
  document: LegalDocumentContent;
};

// Turn "1. Who we are" → "who-we-are" for stable anchor ids.
const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

export const LegalDocumentPage = ({ document }: LegalDocumentPageProps) => (
  <div className="flex min-h-screen flex-col" style={{ color: "var(--foreground)" }}>
    {/* Sticky header */}
    <header
      className="sticky top-0 z-20 backdrop-blur-md"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "color-mix(in srgb, var(--background) 82%, transparent)",
        boxShadow: "0 1px 0 var(--border), 0 4px 20px rgba(20,141,178,0.05)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="ARVANN home">
          <BrandWordmark height={30} priority />
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <LegalLinks compact />
          <Link
            href="/signin"
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>

    <main className="flex-1 pb-24 pt-10 md:pt-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 lg:px-8">

        {/* Hero */}
        <section
          className="overflow-hidden rounded-3xl px-6 py-8 md:px-10 md:py-10"
          style={{
            border: "1px solid var(--border)",
            background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(20,141,178,0.04) 100%)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
                {document.eyebrow}
              </p>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl" style={{ color: "var(--foreground)" }}>
                {document.title}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed md:text-lg md:leading-8" style={{ color: "var(--medium-gray)" }}>
                {document.summary}
              </p>
            </div>
            <div
              className="rounded-2xl p-6"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                Effective Date
              </p>
              <p className="mt-3 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                {document.effectiveDate}
              </p>
              <p className="mt-4 text-sm leading-6" style={{ color: "var(--medium-gray)" }}>
                {document.reviewerNote}
              </p>
            </div>
          </div>
        </section>

        {/* Two-column: sticky ToC + article */}
        <section className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar — sticky Table of Contents */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div
              className="rounded-2xl p-5"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                On this page
              </p>
              <nav className="mt-4">
                <ol className="space-y-2">
                  {document.sections.map((section) => (
                    <li key={section.title}>
                      <a
                        href={`#${slugify(section.title)}`}
                        className="block rounded-lg px-2 py-1.5 text-sm font-medium leading-snug transition-colors hover:bg-black/[0.03]"
                        style={{ color: "var(--medium-gray)" }}
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                Contact
              </p>
              <a
                href={SUPPORT_PHONE_TEL}
                className="mt-3 inline-block text-base font-bold underline underline-offset-4 transition-opacity hover:opacity-70"
                style={{ color: "var(--primary)" }}
              >
                {SUPPORT_PHONE_DISPLAY}
              </a>
              <a
                href={SUPPORT_EMAIL_MAILTO}
                className="mt-1 block text-base font-bold underline underline-offset-4 transition-opacity hover:opacity-70"
                style={{ color: "var(--primary)" }}
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--medium-gray)" }}>
                For privacy requests, verification support, or account-closure assistance.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
              >
                ← Home
              </Link>
              <Link
                href="/signup"
                className="rounded-xl px-3.5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
              >
                Create account
              </Link>
            </div>
          </aside>

          {/* Main article */}
          <article
            className="rounded-3xl p-6 md:p-10"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="space-y-14">
              {document.sections.map((section, idx) => {
                const anchor = slugify(section.title);
                return (
                  <section
                    key={section.title}
                    id={anchor}
                    className="scroll-mt-24 space-y-5"
                    style={
                      idx < document.sections.length - 1
                        ? { borderBottom: "1px solid var(--border)", paddingBottom: "3rem" }
                        : undefined
                    }
                  >
                    <h2
                      className="text-2xl font-bold leading-snug md:text-[26px]"
                      style={{ color: "var(--foreground)" }}
                    >
                      {section.title}
                    </h2>
                    {section.paragraphs.length ? (
                      <div className="space-y-4">
                        {section.paragraphs.map((p) => (
                          <p
                            key={p}
                            className="text-[15px] leading-[1.85] md:text-base md:leading-8"
                            style={{ color: "var(--medium-gray)" }}
                          >
                            {p}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    {section.items?.length ? (
                      <ul className="space-y-3">
                        {section.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-3 text-[15px] leading-[1.85] md:text-base md:leading-8"
                            style={{ color: "var(--medium-gray)" }}
                          >
                            <span
                              aria-hidden
                              className="mt-[11px] h-1.5 w-1.5 flex-shrink-0 rounded-full md:mt-[13px]"
                              style={{ backgroundColor: "var(--primary)" }}
                            />
                            <span className="flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </article>
        </section>

        {/* Footer CTA */}
        <div
          className="rounded-2xl px-6 py-5 md:px-8 md:py-6"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Have questions about your data or verification?
              </p>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--medium-gray)" }}>
                Contact ARVANN on{" "}
                <a
                  href={SUPPORT_PHONE_TEL}
                  className="font-semibold underline underline-offset-4 transition-opacity hover:opacity-70"
                  style={{ color: "var(--primary)" }}
                >
                  {SUPPORT_PHONE_DISPLAY}
                </a>{" "}
                or at{" "}
                <a
                  href={SUPPORT_EMAIL_MAILTO}
                  className="font-semibold underline underline-offset-4 transition-opacity hover:opacity-70"
                  style={{ color: "var(--primary)" }}
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </div>
            <LegalLinks />
          </div>
        </div>

      </div>
    </main>

    <SiteFooter />
  </div>
);
