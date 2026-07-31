"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PRODUCT_CATEGORIES } from "../../utils/categories";

export type ListingFilterState = {
  category: string;
  priceMin: string;
  priceMax: string;
  stockFilter: "" | "in_stock" | "low_stock";
  /** Client-side post-filter only — no server-side location facet exists yet (see plan open decisions). */
  location: string;
  verifiedOnly: boolean;
};

export const EMPTY_LISTING_FILTERS: ListingFilterState = {
  category: "",
  priceMin: "",
  priceMax: "",
  stockFilter: "",
  location: "",
  verifiedOnly: false,
};

export const hasActiveFilters = (f: ListingFilterState): boolean =>
  Boolean(f.category || f.priceMin || f.priceMax || f.stockFilter || f.location || f.verifiedOnly);

type Props = {
  value: ListingFilterState;
  onChange: (next: ListingFilterState) => void;
  /** Distinct company locations from the currently-loaded results, for the location facet. */
  availableLocations: string[];
  /** Mobile slide-over open state — ignored at lg+, where the sidebar is always visible. */
  open: boolean;
  onClose: () => void;
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>{children}</p>
);

const FilterContent = ({ value, onChange, availableLocations }: Omit<Props, "open" | "onClose">) => {
  const set = <K extends keyof ListingFilterState>(key: K, v: ListingFilterState[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Filters</p>
        {hasActiveFilters(value) && (
          <button type="button" onClick={() => onChange(EMPTY_LISTING_FILTERS)}
            className="text-xs font-bold transition-opacity hover:opacity-70" style={{ color: "var(--accent)" }}>
            Clear all
          </button>
        )}
      </div>

      <div>
        <SectionLabel>Category</SectionLabel>
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
            <input type="radio" name="listing-category" checked={value.category === ""} onChange={() => set("category", "")} />
            All categories
          </label>
          {PRODUCT_CATEGORIES.map((cat) => (
            <label key={cat.id} className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
              <input type="radio" name="listing-category" checked={value.category === cat.id} onChange={() => set("category", cat.id)} />
              {cat.icon} {cat.title}
            </label>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Price (₹)</SectionLabel>
        <div className="flex items-center gap-2">
          <input type="number" min="0" placeholder="Min" value={value.priceMin} onChange={(e) => set("priceMin", e.target.value)}
            className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }} />
          <span style={{ color: "var(--medium-gray)" }}>–</span>
          <input type="number" min="0" placeholder="Max" value={value.priceMax} onChange={(e) => set("priceMax", e.target.value)}
            className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }} />
        </div>
      </div>

      <div>
        <SectionLabel>Availability</SectionLabel>
        <div className="space-y-1.5">
          {([["", "All"], ["in_stock", "In stock"], ["low_stock", "Low stock"]] as const).map(([v, label]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
              <input type="radio" name="listing-stock" checked={value.stockFilter === v} onChange={() => set("stockFilter", v)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {availableLocations.length > 0 && (
        <div>
          <SectionLabel>Location</SectionLabel>
          <select value={value.location} onChange={(e) => set("location", e.target.value)}
            className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
            <option value="">All locations</option>
            {availableLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
        <input type="checkbox" checked={value.verifiedOnly} onChange={(e) => set("verifiedOnly", e.target.checked)} />
        ✅ Verified sellers only
      </label>
    </div>
  );
};

/** Category/price/stock/location/verified facets — sticky on desktop, a slide-over sheet below lg. */
export const FilterSidebar = ({ value, onChange, availableLocations, open, onClose }: Props) => (
  <>
    <aside className="hidden lg:sticky lg:top-20 lg:block lg:w-64 lg:flex-shrink-0 lg:self-start lg:rounded-2xl lg:p-5"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
      <FilterContent value={value} onChange={onChange} availableLocations={availableLocations} />
    </aside>

    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto p-5 lg:hidden"
            style={{ backgroundColor: "var(--surface)", boxShadow: "8px 0 30px rgba(0,0,0,0.15)" }}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Filters</p>
              <button type="button" onClick={onClose} aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold" style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}>×</button>
            </div>
            <FilterContent value={value} onChange={onChange} availableLocations={availableLocations} />
            <button type="button" onClick={onClose}
              className="mt-6 w-full rounded-xl py-2.5 text-sm font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
              Show results
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
);
