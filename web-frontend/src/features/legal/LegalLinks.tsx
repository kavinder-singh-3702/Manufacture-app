import Link from "next/link";

type LegalLinksProps = {
  compact?: boolean;
  centered?: boolean;
  className?: string;
};

export const LegalLinks = ({ compact = false, centered = false, className = "" }: LegalLinksProps) => {
  const wrapperClassName = compact ? "text-xs" : "text-sm";
  const alignmentClassName = centered ? "justify-center" : "justify-start";

  return (
    <nav
      aria-label="Legal links"
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 font-semibold ${wrapperClassName} ${alignmentClassName} ${className}`.trim()}
    >
      <Link href="/privacy-policy" className="transition hover:text-[var(--color-plum)]">
        Privacy Policy
      </Link>
      <Link href="/terms-and-conditions" className="transition hover:text-[var(--color-plum)]">
        Terms & Conditions
      </Link>
    </nav>
  );
};
