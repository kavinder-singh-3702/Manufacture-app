import type { Product } from "@/src/types/product";

export type SpecRow = { label: string; value: string };

/**
 * Curated labels for common seller-entered attribute keys. Anything not
 * listed here still renders — `humanizeKey` turns the raw key into a
 * Title Case label — so sellers can add arbitrary specs without a
 * frontend change. This map (plus `humanizeKey`) is the single place
 * that decides "what is a spec"; nothing else in the app should re-derive it.
 */
const KNOWN_SPEC_LABELS: Record<string, string> = {
  material: "Material",
  color: "Color",
  colour: "Color",
  brand: "Brand",
  shape: "Shape",
  size: "Size",
  usage: "Usage / Application",
  application: "Usage / Application",
  finish: "Finish",
  weight: "Weight",
  dimensions: "Dimensions",
  compartments: "Number of Compartments",
  numberOfCompartments: "Number of Compartments",
  origin: "Country of Origin",
  warranty: "Warranty",
};

/** Attribute keys rendered in their own dedicated module — excluded from the generic spec table. */
const ADDITIONAL_INFO_KEYS = ["itemCode", "productionCapacity", "deliveryTime", "packagingDetails"] as const;
const ADDITIONAL_INFO_LABELS: Record<(typeof ADDITIONAL_INFO_KEYS)[number], string> = {
  itemCode: "Item Code",
  productionCapacity: "Production Capacity",
  deliveryTime: "Delivery Time",
  packagingDetails: "Packaging Details",
};
const RESERVED_ATTRIBUTE_KEYS = new Set<string>([...ADDITIONAL_INFO_KEYS, "moq", "rating", "stars"]);

const humanizeKey = (key: string): string =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Renders scalars and short arrays; returns null for empty/nested values so callers can skip the row. */
const stringifyValue = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).map(String).join(", ");
    return joined || null;
  }
  if (typeof value === "object") return null;
  return String(value);
};

/**
 * Buy-box / Product Details spec table. Known typed fields first, then the
 * free-form `attributes` Map (minus fields that have their own module).
 */
export const buildSpecRows = (product: Product): SpecRow[] => {
  const rows: SpecRow[] = [];
  if (product.subCategory) rows.push({ label: "Sub-category", value: product.subCategory });
  if (product.sku) rows.push({ label: "SKU", value: product.sku });
  if (product.unit) rows.push({ label: "Unit", value: product.unit });

  const attributes = product.attributes ?? {};
  for (const [key, raw] of Object.entries(attributes)) {
    if (RESERVED_ATTRIBUTE_KEYS.has(key)) continue;
    const value = stringifyValue(raw);
    if (!value) continue;
    rows.push({ label: KNOWN_SPEC_LABELS[key] ?? humanizeKey(key), value });
  }
  return rows;
};

/** "Additional Information" table — item code, production capacity, delivery time, packaging. */
export const buildAdditionalInfoRows = (product: Product): SpecRow[] => {
  const attributes = product.attributes ?? {};
  return ADDITIONAL_INFO_KEYS.map((key) => {
    const value = stringifyValue(attributes[key]);
    return value ? { label: ADDITIONAL_INFO_LABELS[key], value } : null;
  }).filter((row): row is SpecRow => row !== null);
};

/** Minimum order quantity, if the seller set one — omitted entirely otherwise (never fabricated). */
export const getMoq = (product: Product): string | null => stringifyValue(product.attributes?.moq);

const COMPANY_TYPE_LABELS: Record<string, string> = {
  normal: "Business",
  trader: "Trader / Supplier",
  manufacturer: "Manufacturer",
};

/** Company Details table — only fields that actually exist on the Company schema; nothing invented. */
export const buildCompanyRows = (company: Product["company"] | undefined): SpecRow[] => {
  if (!company) return [];
  const rows: SpecRow[] = [];
  if (company.type) rows.push({ label: "Nature of Business", value: COMPANY_TYPE_LABELS[company.type] ?? humanizeKey(company.type) });
  if (company.sizeBucket) rows.push({ label: "Number of Employees", value: company.sizeBucket });
  if (company.foundedAt) {
    const year = new Date(company.foundedAt).getFullYear();
    if (!Number.isNaN(year)) rows.push({ label: "Year Established", value: String(year) });
  }
  if (company.documents?.gstNumber) rows.push({ label: "GST Number", value: company.documents.gstNumber });
  const location = [company.headquarters?.city, company.headquarters?.state].filter(Boolean).join(", ");
  if (location) rows.push({ label: "Location", value: location });
  return rows;
};
