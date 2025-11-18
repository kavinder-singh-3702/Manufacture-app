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
        borderBottom: "1px solid rgba(250, 218, 208, 0.18)",
        backgroundColor: "rgba(17, 24, 39, 0.8)",
      }}
    >
      <Link href="/" className="flex items-center gap-3 text-white">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-semibold"
          style={{ backgroundColor: "rgba(250, 218, 208, 0.25)", color: "var(--color-peach)" }}
        >
          MC
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.4em]" style={{ color: "var(--color-peach)" }}>
            Manufacture
          </p>
          <p className="text-xl font-semibold text-white">Command</p>
        </div>
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-semibold text-white/70 lg:flex">
        {navLinks.map((link) => (
          <a key={link.label} href={link.href} className="transition hover:text-white">
            {link.label}
          </a>
        ))}
      </nav>
      <Link
        href="/signup"
        className="rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wide"
        style={{ backgroundColor: "var(--color-peach)", color: "var(--color-plum)" }}
      >
        Join Now
      </Link>
    </header>
  );
};
