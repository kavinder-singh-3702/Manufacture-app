import Link from "next/link";
import { LegalDocumentContent } from "./legal-content";
import { LegalLinks } from "./LegalLinks";
import { SiteFooter } from "@/src/features/marketing/components/SiteFooter";

type LegalDocumentPageProps = {
  document: LegalDocumentContent;
};

export const LegalDocumentPage = ({ document }: LegalDocumentPageProps) => (
  <div className="flex min-h-screen flex-col" style={{ color: "var(--foreground)" }}>
    {/* Sticky header */}
    <header
      className="sticky top-0 z-20 backdrop-blur-md"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "rgba(248,250,251,0.92)",
        boxShadow: "0 1px 0 var(--border), 0 4px 20px rgba(20,141,178,0.05)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-brand-strong)", boxShadow: "var(--shadow-primary)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
              ARVANN
            </p>
            <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>
              Manufacture Command
            </p>
          </div>
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

    <main className="flex-1 pb-16 pt-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">

        {/* Hero section */}
        <section
          className="overflow-hidden rounded-3xl px-6 py-8 lg:px-8"
          style={{
            border: "1px solid var(--border)",
            background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(20,141,178,0.04) 100%)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
                {document.eyebrow}
              </p>
              <h1 className="text-3xl font-bold md:text-4xl" style={{ color: "var(--foreground)" }}>
                {document.title}
              </h1>
              <p className="max-w-2xl text-base leading-7" style={{ color: "var(--medium-gray)" }}>
                {document.summary}
              </p>
            </div>
            <div
              className="flex-shrink-0 rounded-2xl p-5"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                Effective Date
              </p>
              <p className="mt-2 text-lg font-bold" style={{ color: "var(--foreground)" }}>
                {document.effectiveDate}
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--medium-gray)" }}>
                {document.reviewerNote}
              </p>
            </div>
          </div>
        </section>

        {/* Two-column layout */}
        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.4fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            <div
              className="rounded-2xl p-5"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                Service Operator
              </p>
              <p className="mt-3 text-2xl font-bold" style={{ color: "var(--foreground)" }}>ARVANN</p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--medium-gray)" }}>
                Manufacture Command is operated for business users managing sourcing, manufacturing, operations,
                verification, and transaction workflows.
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                Contact
              </p>
              <a
                href="mailto:support@manufacture.run"
                className="mt-3 inline-block text-base font-bold underline underline-offset-4 transition-opacity hover:opacity-70"
                style={{ color: "var(--primary)" }}
              >
                support@manufacture.run
              </a>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--medium-gray)" }}>
                For privacy requests, legal questions, verification support, or account-closure assistance.
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                Quick access
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
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
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  Create account
                </Link>
              </div>
            </div>
          </aside>

          {/* Main article */}
          <article
            className="rounded-3xl p-6 md:p-8"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="space-y-8">
              {document.sections.map((section) => (
                <section
                  key={section.title}
                  className="space-y-4 border-b pb-8 last:border-b-0 last:pb-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                    {section.title}
                  </h2>
                  <div className="space-y-3 text-sm leading-7" style={{ color: "var(--medium-gray)" }}>
                    {section.paragraphs.map((p) => <p key={p}>{p}</p>)}
                  </div>
                  {section.items?.length ? (
                    <ul className="space-y-2.5 pl-5 text-sm leading-7" style={{ color: "var(--medium-gray)" }}>
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </article>
        </section>

        {/* Inline support CTA */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Need help with verification or legal review?
              </p>
              <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
                Contact ARVANN at{" "}
                <a href="mailto:support@manufacture.run" className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
                  support@manufacture.run
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
