import Link from "next/link";
import { LegalDocumentContent } from "./legal-content";
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

// Deliberately minimal shell:
//  - No "Sign In" / "Create account" CTAs. A legal document exists to
//    inform, not convert. Apple reviewers, regulators, and users who
//    came here for compliance reasons should see the policy first and
//    nothing that reads as a sales funnel.
//  - Header shrinks to just the ARVANN wordmark linking home, so a
//    reader can still get their bearings without any marketing surface.
//  - Sidebar keeps only the Table of Contents (useful navigation within
//    the 14-section document); the Contact block moves to the end of
//    the article where it belongs in a legal doc.
export const LegalDocumentPage = ({ document }: LegalDocumentPageProps) => (
  <div className="flex min-h-screen flex-col" style={{ color: "var(--foreground)" }}>
    {/* Minimal header — just brand, no auth CTAs. */}
    <header
      className="sticky top-0 z-20 backdrop-blur-md"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "color-mix(in srgb, var(--background) 82%, transparent)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="ARVANN home">
          <BrandWordmark height={28} priority />
        </Link>
        <span className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--medium-gray)" }}>
          Legal
        </span>
      </div>
    </header>

    <main className="flex-1 pb-24 pt-12 md:pt-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-5 lg:px-8">

        {/* Simple title block — no gradient hero, no side card. */}
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--medium-gray)" }}>
            {document.eyebrow}
          </p>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl" style={{ color: "var(--foreground)" }}>
            {document.title}
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--medium-gray)" }}
          >
            Effective: {document.effectiveDate}
          </p>
          <p
            className="text-base leading-relaxed md:text-lg md:leading-8"
            style={{ color: "var(--medium-gray)" }}
          >
            {document.summary}
          </p>
        </header>

        {/* Article body — single column, generous rhythm. */}
        <article className="space-y-14">
          {document.sections.map((section, idx) => {
            const anchor = slugify(section.title);
            return (
              <section
                key={section.title}
                id={anchor}
                className="scroll-mt-24 space-y-4"
                style={
                  idx < document.sections.length - 1
                    ? { borderBottom: "1px solid var(--border)", paddingBottom: "3rem" }
                    : undefined
                }
              >
                <h2
                  className="text-xl font-bold leading-snug md:text-2xl"
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
                          style={{ backgroundColor: "var(--medium-gray)" }}
                        />
                        <span className="flex-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </article>

        {/* Contact block at the end — where it belongs on a legal page. */}
        <div
          className="rounded-2xl px-6 py-5 md:px-8 md:py-6"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        >
          <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Contact ARVANN
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--medium-gray)" }}>
            For privacy requests, verification support, or account-closure assistance, reach us at{" "}
            <a
              href={SUPPORT_EMAIL_MAILTO}
              className="font-semibold underline underline-offset-4 transition-opacity hover:opacity-70"
              style={{ color: "var(--foreground)" }}
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            or{" "}
            <a
              href={SUPPORT_PHONE_TEL}
              className="font-semibold underline underline-offset-4 transition-opacity hover:opacity-70"
              style={{ color: "var(--foreground)" }}
            >
              {SUPPORT_PHONE_DISPLAY}
            </a>
            .
          </p>
        </div>

      </div>
    </main>

    <SiteFooter />
  </div>
);
