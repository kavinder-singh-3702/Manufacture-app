import Link from "next/link";
import { BrandWordmark } from "@/src/components/BrandLogo";

const FOOTER_LINKS = {
  Marketplace: [
    { href: "/products", label: "Browse Products" },
    { href: "/industries", label: "Industries" },
    { href: "/shop", label: "In-house Catalog" },
  ],
  "For Businesses": [
    { href: "/signup", label: "Sell on ARVANN" },
    { href: "/manufacturers", label: "Manufacturers" },
    { href: "/suppliers", label: "Suppliers" },
    { href: "/buyers", label: "Buyers" },
    { href: "/services", label: "Business Services" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/support", label: "Support" },
    { href: "/contact", label: "Contact Us" },
  ],
  Legal: [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-and-conditions", label: "Terms of Service" },
  ],
} as const;

// Support email is the one documented in BACKEND-DEPLOYMENT.md — this used to
// read "support@manufacture.run", a leftover from the repo's internal name,
// not a real ARVANN address. LinkedIn/X icons that used to link to
// linkedin.com/x.com's generic homepages (not an ARVANN profile) were removed
// rather than left as dead-end links — add them back once real handles exist.
const SUPPORT_EMAIL = "arvann100@gmail.com";

const SOCIALS: { label: string; href: string; icon: React.ReactNode }[] = [
  {
    label: "Email",
    href: `mailto:${SUPPORT_EMAIL}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export const SiteFooter = ({ className = "" }: { className?: string }) => (
  <footer
    className={`relative mt-auto ${className}`}
    style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
  >
    {/* Accent top line */}
    <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "var(--gradient-brand)" }} />

    <div className="mx-auto w-full max-w-[1600px] px-6 py-14 lg:px-10">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center" aria-label="ARVANN home">
            <BrandWordmark height={32} />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>
            The command center built for Indian manufacturers — manage sourcing, compliance, and partner comms in one workspace.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
            <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: "var(--success)" }}>✓</span>
            <span className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Platform live · India</span>
          </div>
          {/* Socials */}
          <div className="flex items-center gap-2 pt-1">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:-translate-y-0.5"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--medium-gray)" }}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <div key={section} className="space-y-3.5">
            <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "var(--foreground)" }}>
              {section}
            </p>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--primary)]"
                    style={{ color: "var(--medium-gray)" }}
                  >
                    <span className="h-px w-0 bg-[var(--primary)] transition-all duration-200 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="mt-12 flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
          © {new Date().getFullYear()} ARVANN Technologies. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          <Link href="/privacy-policy" className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--medium-gray)" }}>
            Privacy
          </Link>
          <Link href="/terms-and-conditions" className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--medium-gray)" }}>
            Terms
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  </footer>
);
