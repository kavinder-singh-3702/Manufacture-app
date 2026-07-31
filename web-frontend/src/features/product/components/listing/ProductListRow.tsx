import Link from "next/link";
import type { Product } from "@/src/types/product";
import { formatCurrency, getBuyerStock, getCategoryMeta } from "../../utils/categories";
import { getMoq } from "../../utils/specs";
import { buildTrustBadges, formatCompanyLocation } from "../../utils/seller";
import { TrustBadgeRow } from "../pdp";

type Props = {
  product: Product;
  href: string;
  /** "row" — IndiaMART-style horizontal listing row (search/category/seller catalog).
   *  "compact" — narrow vertical card for horizontal carousels (homepage featured strip). */
  variant?: "row" | "compact";
};

/**
 * The single product-listing item, replacing three previously-divergent card
 * implementations (inline cards in PublicMarketplace and MarketplaceSection,
 * plus the dashboard-only ProductCard). Row style leads with supplier/location
 * trust info over imagery, matching IndiaMART's search-results density.
 */
export const ProductListRow = ({ product, href, variant = "row" }: Props) => {
  const cat = getCategoryMeta(product.category);
  const img = product.images?.[0]?.url;
  const location = formatCompanyLocation(product.company);
  const trustBadges = buildTrustBadges(product.company);
  const moq = getMoq(product);
  const stock = getBuyerStock(product.stockStatus, product.availableQuantity);

  const thumb = (
    <div className={variant === "row"
      ? "relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-32"
      : "relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl"}
      style={{ background: cat ? `linear-gradient(135deg, ${cat.bg} 0%, ${cat.bg}cc 100%)` : "var(--light-gray)" }}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img loading="lazy" decoding="async" src={img} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className={`flex h-full w-full items-center justify-center ${variant === "row" ? "text-3xl" : "text-4xl"}`}>{cat?.icon ?? "📦"}</div>
      )}
      {!stock.available && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: "rgba(220,38,38,0.9)" }}>
            Out of stock
          </span>
        </div>
      )}
    </div>
  );

  const body = (
    <div className="min-w-0 flex-1">
      {cat && variant === "row" && (
        <span className="mb-1 inline-block text-[10px] font-bold uppercase tracking-wide" style={{ color: cat.text }}>
          {cat.icon} {cat.title}
        </span>
      )}
      <h3 className={variant === "row" ? "line-clamp-2 text-[15px] font-bold leading-snug" : "line-clamp-2 text-xs font-bold leading-snug"}
        style={{ color: "var(--foreground)" }}>
        {product.name}
      </h3>

      {product.company?.displayName && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={variant === "row" ? "text-xs font-semibold" : "truncate text-[10px]"} style={{ color: "var(--medium-gray)" }}>
            {product.company.displayName}
          </span>
          {variant === "row" && trustBadges.length > 0 && <TrustBadgeRow badges={trustBadges.slice(0, 2)} />}
        </div>
      )}

      {variant === "row" && location && (
        <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--medium-gray)" }}>
          📍 {location}
        </p>
      )}

      <div className={variant === "row" ? "mt-2 flex items-baseline gap-1.5" : "mt-1.5 flex items-baseline gap-1"}>
        <span className={variant === "row" ? "text-lg font-black" : "text-sm font-bold"} style={{ color: "var(--foreground)" }}>
          {formatCurrency(product.price.amount, product.price.currency)}
        </span>
        {product.price.unit && (
          <span className={variant === "row" ? "text-xs" : "text-[10px]"} style={{ color: "var(--medium-gray)" }}>/ {product.price.unit}</span>
        )}
      </div>
      {variant === "row" && moq && (
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--medium-gray)" }}>MOQ: {moq}</p>
      )}
    </div>
  );

  if (variant === "compact") {
    return (
      <Link href={href} className="group flex w-52 flex-shrink-0 flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        {thumb}
        <div className="p-3">{body}</div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group flex gap-4 rounded-2xl p-4 transition-shadow hover:shadow-md"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
      {thumb}
      {body}
      <div className="hidden flex-shrink-0 flex-col items-end justify-center gap-2 sm:flex">
        <span className="rounded-xl px-4 py-2 text-xs font-bold text-white transition-opacity group-hover:opacity-90"
          style={{ backgroundColor: "var(--primary)" }}>
          {stock.available ? "Get Best Price" : "Ask availability"}
        </span>
      </div>
    </Link>
  );
};
