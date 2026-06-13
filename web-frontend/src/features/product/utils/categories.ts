import type { ProductStockStatus } from "@/src/types/product";

export type CategoryMeta = {
  id: string;
  title: string;
  icon: string;
  bg: string;
  text: string;
};

export const PRODUCT_CATEGORIES: readonly CategoryMeta[] = [
  { id: "food-beverage-manufacturing",          title: "Food & Beverage",     icon: "🍚", bg: "#FEF3C7", text: "#92400E" },
  { id: "textile-apparel-manufacturing",        title: "Textile & Apparel",   icon: "👕", bg: "#F3E8FF", text: "#6B21A8" },
  { id: "paper-packaging-industry",             title: "Paper & Packaging",   icon: "📦", bg: "#E0F2FE", text: "#075985" },
  { id: "chemical-manufacturing",               title: "Chemical",            icon: "⚗️", bg: "#FFE4E6", text: "#9F1239" },
  { id: "pharmaceutical-medical",               title: "Pharma & Medical",    icon: "💊", bg: "#E0E7FF", text: "#3730A3" },
  { id: "plastic-polymer-industry",             title: "Plastic & Polymer",   icon: "🧴", bg: "#DCFCE7", text: "#166534" },
  { id: "rubber-industry",                      title: "Rubber",              icon: "🛞", bg: "#FFF7ED", text: "#9A3412" },
  { id: "metal-steel-industry",                 title: "Metal & Steel",       icon: "🏗️", bg: "#E5E7EB", text: "#374151" },
  { id: "automobile-auto-components",           title: "Automobile",          icon: "🚗", bg: "#FEE2E2", text: "#991B1B" },
  { id: "electrical-electronics-manufacturing", title: "Electronics",         icon: "🔌", bg: "#DBEAFE", text: "#1E40AF" },
  { id: "machinery-heavy-engineering",          title: "Machinery",           icon: "⚙️", bg: "#EDE9FE", text: "#5B21B6" },
  { id: "wood-furniture-industry",              title: "Wood & Furniture",    icon: "🪑", bg: "#FEF9C3", text: "#854D0E" },
  { id: "construction-material-industry",       title: "Construction",        icon: "🧱", bg: "#FFEDD5", text: "#9A3412" },
  { id: "consumer-goods-fmcg",                  title: "Consumer Goods",      icon: "🧼", bg: "#ECFDF3", text: "#166534" },
  { id: "defence-aerospace-manufacturing",      title: "Defence & Aerospace", icon: "✈️", bg: "#E0F2FE", text: "#075985" },
  { id: "handicrafts-cottage-industries",       title: "Handicrafts",         icon: "🧶", bg: "#FFF7ED", text: "#9A3412" },
] as const;

export const getCategoryMeta = (id: string | undefined): CategoryMeta | undefined =>
  PRODUCT_CATEGORIES.find((c) => c.id === id);

export const formatCurrency = (amount: number, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  draft:    { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8", label: "Draft" },
  active:   { bg: "#DCFCE7", text: "#15803D", dot: "#22C55E", label: "Active" },
  inactive: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", label: "Inactive" },
  archived: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", label: "Archived" },
};

export const STOCK_STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  in_stock:     { bg: "#DCFCE7", text: "#15803D", label: "In stock" },
  low_stock:    { bg: "#FEF3C7", text: "#92400E", label: "Low stock" },
  out_of_stock: { bg: "#FEE2E2", text: "#991B1B", label: "Out of stock" },
};

export type BuyerStockDisplay = {
  available: boolean;
  /** Status label only — never exposes an exact quantity. */
  label: string;
  /** Encourages the buyer to reach out (they ask for quantity & pricing). */
  hint: string;
  icon: string;
  /** Theme-aware tokens — adapt to light/dark via semantic CSS vars. */
  fg: string;
  bg: string;
  border: string;
};

/**
 * Buyer-facing stock state. Deliberately hides exact quantities — buyers
 * contact the seller to ask about quantity & pricing, mirroring the app's
 * public-listing behaviour (`isPublicListingProduct`). Colors resolve from
 * semantic CSS vars so the badge reads correctly in both light and dark.
 */
export const getBuyerStock = (
  status: ProductStockStatus | undefined,
  availableQuantity: number | undefined
): BuyerStockDisplay => {
  const inStock = status ? status !== "out_of_stock" : (availableQuantity ?? 0) > 0;

  if (!inStock) {
    return {
      available: false,
      label: "Out of stock",
      hint: "Contact the seller to check availability",
      icon: "❌",
      fg: "var(--error)",
      bg: "color-mix(in srgb, var(--error) 12%, transparent)",
      border: "color-mix(in srgb, var(--error) 30%, transparent)",
    };
  }

  if (status === "low_stock") {
    return {
      available: true,
      label: "Limited stock",
      hint: "Contact the seller for quantity & pricing",
      icon: "⚠️",
      fg: "var(--warning)",
      bg: "color-mix(in srgb, var(--warning) 14%, transparent)",
      border: "color-mix(in srgb, var(--warning) 32%, transparent)",
    };
  }

  return {
    available: true,
    label: "In stock",
    hint: "Contact the seller for quantity & pricing",
    icon: "✅",
    fg: "var(--success)",
    bg: "color-mix(in srgb, var(--success) 13%, transparent)",
    border: "color-mix(in srgb, var(--success) 30%, transparent)",
  };
};
