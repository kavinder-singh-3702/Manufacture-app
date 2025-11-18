import Link from "next/link";

const navLinks = [
  { href: "#", label: "Overview" },
  { href: "#", label: "Marketplace" },
  { href: "#", label: "Pricing" },
  { href: "#", label: "Support" },
] as const;

export const TopBar = () => {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-6 px-4 py-4 backdrop-blur"
      style={{
        borderBottom: "1px solid var(--border-soft)",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        boxShadow: "0 20px 45px rgba(90, 48, 66, 0.08)",
      }}
    >
      <Link href="/" className="flex items-center gap-3" style={{ color: "var(--foreground)" }}>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-semibold"
          style={{ backgroundColor: "var(--color-linen)", color: "var(--color-plum)", border: "1px solid var(--border-soft)" }}
        >
          MC
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Manufacture
          </p>
          <p className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
            Command
          </p>
        </div>
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-semibold text-[#43343d]/90 lg:flex">
        {navLinks.map((link) => (
          <a key={link.label} href={link.href} className="transition hover:text-[#5a3042]">
            {link.label}
          </a>
        ))}
      </nav>
      <Link
        href="/signup"
        className="rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wide"
        style={{
          backgroundColor: "var(--color-peach)",
          color: "var(--color-plum)",
          boxShadow: "0 10px 25px rgba(246, 184, 168, 0.65)",
        }}
      >
        Join Now
      </Link>
    </header>
  );
};
