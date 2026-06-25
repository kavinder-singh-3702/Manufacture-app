import Link from "next/link";
import { BrandWordmark } from "@/src/components/BrandLogo";

const FOOTER_LINKS = {
  Marketplace: [
    { href: "/products", label: "Browse Products" },
    { href: "/dashboard/products/search", label: "Search Catalog" },
    { href: "/signup", label: "Sell on ARVANN" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/support", label: "Support" },
    { href: "/contact", label: "Contact Us" },
  ],
  Workspace: [
    { href: "/dashboard", label: "Command Center" },
    { href: "/dashboard/products", label: "Products Catalog" },
    { href: "/signup", label: "Create Workspace" },
  ],
  Legal: [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-and-conditions", label: "Terms of Service" },
  ],
} as const;

const SOCIALS: { label: string; href: string; icon: React.ReactNode }[] = [
  {
    label: "Email",
    href: "mailto:support@manufacture.run",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.3-.02-3-1.83-3-1.83 0-2.12 1.43-2.12 2.9V21H9z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://x.com",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5.3-7-6.1 7H1.7l8-9.2L1 2h7l4.8 6.4L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z" />
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
          <a href="mailto:support@manufacture.run" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
            support@manufacture.run
          </a>
        </div>
      </div>
    </div>
  </footer>
);
