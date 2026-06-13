import Link from "next/link";
import { BrandWordmark } from "@/src/components/BrandLogo";

const FOOTER_LINKS = {
  Platform: [
    { href: "/dashboard", label: "Command Center" },
    { href: "/dashboard/products", label: "Products Catalog" },
    { href: "/signup", label: "Create Workspace" },
  ],
  Company: [
    { href: "#overview", label: "About" },
    { href: "#support", label: "Support" },
    { href: "mailto:support@manufacture.run", label: "Contact Us" },
  ],
  Legal: [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-and-conditions", label: "Terms of Service" },
  ],
} as const;

export const SiteFooter = ({ className = "" }: { className?: string }) => (
  <footer
    className={`mt-auto ${className}`}
    style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
  >
    <div className="mx-auto w-full max-w-[1600px] px-6 py-12 lg:px-10">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center" aria-label="ARVANN home">
            <BrandWordmark height={32} />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>
            The command center built for Indian manufacturers — manage sourcing, compliance, and partner comms in one workspace.
          </p>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A] text-[9px] text-white font-bold">✓</span>
            <span className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Platform live · India</span>
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <div key={section} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
              {section}
            </p>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium transition-opacity hover:opacity-70"
                    style={{ color: "var(--foreground)" }}
                  >
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
        className="mt-10 flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
          © {new Date().getFullYear()} ARVANN Technologies. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/privacy-policy" className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--medium-gray)" }}>
            Privacy
          </Link>
          <Link href="/terms-and-conditions" className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--medium-gray)" }}>
            Terms
          </Link>
          <a href="mailto:support@manufacture.run" className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
            support@manufacture.run
          </a>
        </div>
      </div>
    </div>
  </footer>
);
