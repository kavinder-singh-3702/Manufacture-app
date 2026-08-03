import type { ProductStockStatus } from "@/src/types/product";

export type CategoryMeta = {
  id: string;
  title: string;
  icon: string;
  bg: string;
  text: string;
  /**
   * Sub-verticals within the industry, used to generate the
   * /industries/[industry]/[subcategory] SEO landing pages (Phase 2) and to
   * populate the product form's sub-category picker. Kept in sync by hand
   * with backend/src/constants/product.js `PRODUCT_CATEGORIES[].subCategories`
   * — there is no shared package between the JS backend and TS frontend, so
   * this list only ever grows when that one does.
   */
  subCategories?: readonly string[];
};

/**
 * Canonical category list — mirrors backend/src/constants/product.js
 * `PRODUCT_CATEGORIES` id-for-id and label-for-label (label -> title). This
 * used to be a hand-picked 16-entry subset that had drifted from the
 * backend's 27, silently dropping categories like `leather-industry` and
 * `petroleum-energy-manufacturing` (which already has a live product) from
 * every category page, filter, and the sitemap. Now 1:1 with the backend so
 * nothing sold on the marketplace is missing a landing page.
 *
 * The last 7 entries (`LEGACY_CATEGORY_IDS`) are generic catch-all buckets,
 * not real industries — they stay in this list (and every dropdown that
 * reads from it) for backward-compatible product tagging, but are excluded
 * from the /industries SEO pages and sitemap via `isIndustryCategory` since a
 * "Components & Parts" editorial landing page would be contrived filler, not
 * genuinely unique content.
 */
export const PRODUCT_CATEGORIES: readonly CategoryMeta[] = [
  { id: "food-beverage-manufacturing",          title: "Food & Beverage Manufacturing",          icon: "🍚", bg: "#FEF3C7", text: "#92400E",
    subCategories: ["Rice mills & flour mills", "Sugar mills", "Dairy products", "Bakery & confectionery", "Snacks, namkeen & beverages", "Bottled water", "Meat & seafood processing"] },
  { id: "textile-apparel-manufacturing",        title: "Textile & Apparel Manufacturing",        icon: "👕", bg: "#F3E8FF", text: "#6B21A8",
    subCategories: ["Cotton, wool & silk textiles", "Yarn & fabric manufacturing", "Garments & readymade clothes", "Denim & hosiery", "Home textiles"] },
  { id: "paper-packaging-industry",             title: "Paper & Packaging Industry",              icon: "📦", bg: "#E0F2FE", text: "#075985",
    subCategories: ["Paper mills", "Corrugated box manufacturing", "Cartons & duplex boxes", "Tissue paper & notebooks", "Flexible packaging (pouches, films)"] },
  { id: "chemical-manufacturing",               title: "Chemical Manufacturing",                  icon: "⚗️", bg: "#FFE4E6", text: "#9F1239",
    subCategories: ["Industrial chemicals", "Fertilizers & pesticides", "Paints & coatings", "Dyes & pigments", "Adhesives & resins"] },
  { id: "pharmaceutical-medical",               title: "Pharmaceutical & Medical Manufacturing",  icon: "💊", bg: "#E0E7FF", text: "#3730A3",
    subCategories: ["Medicines & tablets", "Syrups & injections", "Medical devices", "Surgical instruments", "PPE kits & masks"] },
  { id: "plastic-polymer-industry",             title: "Plastic & Polymer Industry",              icon: "🧴", bg: "#DCFCE7", text: "#166534",
    subCategories: ["Plastic molding products", "PET bottles & containers", "PVC pipes & fittings", "Plastic packaging", "Household plastic items"] },
  { id: "rubber-industry",                      title: "Rubber Industry",                         icon: "🛞", bg: "#FFF7ED", text: "#9A3412",
    subCategories: ["Tyres & tubes", "Rubber sheets", "Seals & gaskets", "Footwear"] },
  { id: "metal-steel-industry",                 title: "Metal & Steel Industry",                  icon: "🏗️", bg: "#E5E7EB", text: "#374151",
    subCategories: ["Iron & steel plants", "Aluminium & copper products", "Casting & forging", "Metal fabrication", "Sheets, rods & wires"] },
  { id: "automobile-auto-components",           title: "Automobile & Auto Components",            icon: "🚗", bg: "#FEE2E2", text: "#991B1B",
    subCategories: ["Cars, bikes & tractors", "Auto parts", "Batteries", "Tyres & accessories"] },
  { id: "electrical-electronics-manufacturing", title: "Electrical & Electronics Manufacturing",  icon: "🔌", bg: "#DBEAFE", text: "#1E40AF",
    subCategories: ["Wires & cables", "Switches, fans & lights", "Home appliances", "Mobile phones & parts", "Solar panels"] },
  { id: "machinery-heavy-engineering",          title: "Machinery & Heavy Engineering",           icon: "⚙️", bg: "#EDE9FE", text: "#5B21B6",
    subCategories: ["Industrial machines", "Agricultural equipment", "Construction machinery", "Machine tools"] },
  { id: "wood-furniture-industry",              title: "Wood & Furniture Industry",               icon: "🪑", bg: "#FEF9C3", text: "#854D0E",
    subCategories: ["Furniture", "Plywood & MDF boards", "Doors & windows", "Wooden packaging"] },
  { id: "construction-material-industry",       title: "Construction Material Industry",          icon: "🧱", bg: "#FFEDD5", text: "#9A3412",
    subCategories: ["Cement", "Bricks & tiles", "Glass & ceramics", "Sanitaryware"] },
  { id: "leather-industry",                     title: "Leather Industry",                        icon: "👞", bg: "#FDE68A", text: "#9D174D",
    subCategories: ["Leather processing", "Shoes & footwear", "Bags, belts & wallets"] },
  { id: "petroleum-energy-manufacturing",       title: "Petroleum & Energy-Based Manufacturing",  icon: "⛽", bg: "#FFF1F2", text: "#9A3412",
    subCategories: ["Oil refining", "Lubricants", "Petrochemicals", "Biofuels"] },
  { id: "defence-aerospace-manufacturing",      title: "Defence & Aerospace Manufacturing",       icon: "✈️", bg: "#E0F2FE", text: "#075985",
    subCategories: ["Aircraft components", "Missiles & weapons", "Defence electronics", "Space equipment"] },
  { id: "consumer-goods-fmcg",                  title: "Consumer Goods (FMCG) Manufacturing",     icon: "🧼", bg: "#ECFDF3", text: "#166534",
    subCategories: ["Soaps & detergents", "Cosmetics & personal care", "Home cleaning products", "Stationery"] },
  { id: "printing-publishing",                  title: "Printing & Publishing",                   icon: "📰", bg: "#E5E7EB", text: "#4338CA",
    subCategories: ["Books & newspapers", "Labels & stickers", "Packaging printing"] },
  { id: "toys-sports-goods",                    title: "Toys & Sports Goods Manufacturing",       icon: "🎾", bg: "#F3E8FF", text: "#BE123C",
    subCategories: ["Toys", "Sports equipment", "Fitness items"] },
  { id: "handicrafts-cottage-industries",       title: "Handicrafts & Cottage Industries",        icon: "🧶", bg: "#FFF7ED", text: "#9A3412",
    subCategories: ["Handloom", "Pottery", "Hand-made items", "Decorative products"] },
  // Legacy catch-all buckets — not real industries, see doc comment above.
  { id: "finished-goods", title: "Finished Goods",     icon: "📦", bg: "#E0EAFF", text: "#334155" },
  { id: "components",     title: "Components & Parts", icon: "🧩", bg: "#E9D5FF", text: "#334155" },
  { id: "raw-materials",  title: "Raw Materials",       icon: "🧱", bg: "#DCFCE7", text: "#334155" },
  { id: "machinery",      title: "Machinery & Equipment", icon: "⚙️", bg: "#FFE4E6", text: "#334155" },
  { id: "packaging",      title: "Packaging",           icon: "🎁", bg: "#FFF7ED", text: "#334155" },
  { id: "services",       title: "Services",            icon: "🛠️", bg: "#E0F2FE", text: "#334155" },
  { id: "other",          title: "Other",                icon: "🗂️", bg: "#F3F4F6", text: "#334155" },
] as const;

/** The 7 generic catch-all category ids excluded from SEO industry pages. */
export const LEGACY_CATEGORY_IDS: ReadonlySet<string> = new Set([
  "finished-goods", "components", "raw-materials", "machinery", "packaging", "services", "other",
]);

/** Real industries only — what /industries, the industry sitemap, and generateStaticParams use. */
export const INDUSTRY_CATEGORIES: readonly CategoryMeta[] = PRODUCT_CATEGORIES.filter(
  (c) => !LEGACY_CATEGORY_IDS.has(c.id)
);

export const getCategoryMeta = (id: string | undefined): CategoryMeta | undefined =>
  PRODUCT_CATEGORIES.find((c) => c.id === id);

/**
 * Canonical link target for a category chip/filter anywhere in the app: the
 * new `/industries/[id]` editorial page for a real industry, or the existing
 * `/products/category/[id]` filter route for one of the 7 legacy buckets
 * (which have no /industries page). `next.config.ts` permanently redirects
 * `/products/category/[id]` -> `/industries/[id]` for every real industry, so
 * linking here directly avoids sending every internal nav click through that
 * redirect hop.
 */
export const getCategoryHref = (id: string): string =>
  LEGACY_CATEGORY_IDS.has(id) ? `/products/category/${id}` : `/industries/${id}`;

/** URL-safe slug for a subcategory label, e.g. "Cotton, wool & silk textiles" -> "cotton-wool-silk-textiles". */
export const slugifySubCategory = (label: string): string =>
  label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getSubCategoryBySlug = (
  category: CategoryMeta | undefined,
  slug: string
): string | undefined => category?.subCategories?.find((s) => slugifySubCategory(s) === slug);

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
