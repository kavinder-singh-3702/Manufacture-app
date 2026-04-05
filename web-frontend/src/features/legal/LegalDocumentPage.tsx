import Link from "next/link";
import { LegalDocumentContent } from "./legal-content";
import { LegalLinks } from "./LegalLinks";

type LegalDocumentPageProps = {
  document: LegalDocumentContent;
};

export const LegalDocumentPage = ({ document }: LegalDocumentPageProps) => {
  return (
    <div className="min-h-screen" style={{ color: "var(--foreground)" }}>
      <header
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{
          borderColor: "var(--border-soft)",
          backgroundColor: "rgba(255, 255, 255, 0.88)",
          boxShadow: "0 20px 45px rgba(90, 48, 66, 0.08)",
        }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-3" style={{ color: "var(--foreground)" }}>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl border text-lg font-semibold"
              style={{
                backgroundColor: "var(--color-linen)",
                color: "var(--color-plum)",
                borderColor: "var(--border-soft)",
              }}
            >
              AR
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
                ARVANN
              </p>
              <p className="text-lg font-semibold">Manufacture Command</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <LegalLinks compact className="text-[#5c4451]" />
            <Link
              href="/signin"
              className="rounded-full px-5 py-2 text-sm font-semibold"
              style={{
                backgroundColor: "var(--color-plum)",
                color: "white",
                boxShadow: "0 10px 25px rgba(90, 48, 66, 0.16)",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-20 pt-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <section
            className="overflow-hidden rounded-[2rem] border px-6 py-8 shadow-xl shadow-[#5a304214] lg:px-8"
            style={{
              borderColor: "var(--border-soft)",
              background:
                "radial-gradient(circle at top right, rgba(250, 218, 208, 0.65), transparent 36%), linear-gradient(135deg, #fffdf9, var(--color-linen))",
            }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
                  {document.eyebrow}
                </p>
                <h1 className="text-3xl font-semibold text-[#2e1f2c] md:text-5xl">{document.title}</h1>
                <p className="max-w-2xl text-base leading-7 text-[#5c4451] md:text-lg">{document.summary}</p>
              </div>

              <div
                className="rounded-3xl border bg-white/85 p-5 shadow-sm shadow-[#5a304214]"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                  Effective Date
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2e1f2c]">{document.effectiveDate}</p>
                <p className="mt-3 text-sm leading-6 text-[#5c4451]">{document.reviewerNote}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
            <aside className="space-y-5">
              <div
                className="rounded-3xl border bg-white/90 p-5 shadow-sm shadow-[#5a304214]"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                  Service Operator
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#2e1f2c]">ARVANN</p>
                <p className="mt-2 text-sm leading-6 text-[#5c4451]">
                  Manufacture Command is operated for business users managing sourcing, manufacturing, operations,
                  verification, and transaction workflows.
                </p>
              </div>

              <div
                className="rounded-3xl border bg-white/90 p-5 shadow-sm shadow-[#5a304214]"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                  Contact
                </p>
                <a
                  href="mailto:arvann100@gmail.com"
                  className="mt-3 inline-flex text-lg font-semibold text-[#2e1f2c] underline decoration-[var(--color-peach)] underline-offset-4"
                >
                  arvann100@gmail.com
                </a>
                <p className="mt-2 text-sm leading-6 text-[#5c4451]">
                  Use this contact for privacy requests, legal questions, verification support, or account-closure
                  assistance.
                </p>
              </div>

              <div
                className="rounded-3xl border bg-[var(--surface-muted)] p-5"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                  Quick Access
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="rounded-full border px-4 py-2 text-sm font-semibold"
                    style={{ borderColor: "var(--border-soft)", color: "var(--color-plum)" }}
                  >
                    Back to home
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full px-4 py-2 text-sm font-semibold"
                    style={{ backgroundColor: "var(--color-peach)", color: "var(--color-plum)" }}
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </aside>

            <article
              className="rounded-[2rem] border bg-white/92 p-6 shadow-xl shadow-[#5a304210] md:p-8"
              style={{ borderColor: "var(--border-soft)" }}
            >
              <div className="space-y-8">
                {document.sections.map((section) => (
                  <section key={section.title} className="space-y-4 border-b pb-8 last:border-b-0 last:pb-0" style={{ borderColor: "rgba(90, 48, 66, 0.08)" }}>
                    <h2 className="text-2xl font-semibold text-[#2e1f2c]">{section.title}</h2>
                    <div className="space-y-3 text-sm leading-7 text-[#5c4451] md:text-[15px]">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    {section.items?.length ? (
                      <ul className="space-y-3 pl-5 text-sm leading-7 text-[#5c4451] md:text-[15px]">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </article>
          </section>

          <footer
            className="rounded-[2rem] border px-6 py-6 shadow-sm"
            style={{
              borderColor: "var(--border-soft)",
              background: "linear-gradient(135deg, rgba(255, 253, 249, 0.96), rgba(252, 238, 231, 0.92))",
            }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#2e1f2c]">Need help with verification or legal review?</p>
                <p className="text-sm text-[#5c4451]">
                  Contact ARVANN at{" "}
                  <a href="mailto:arvann100@gmail.com" className="font-semibold text-[#2e1f2c] underline underline-offset-4">
                    arvann100@gmail.com
                  </a>
                  .
                </p>
              </div>
              <LegalLinks className="text-[#5c4451]" />
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};
