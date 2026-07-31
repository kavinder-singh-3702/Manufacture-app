"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductSort } from "@/src/types/product";
import { getCategoryMeta } from "@/src/features/product/utils/categories";
import {
  FilterSidebar, EMPTY_LISTING_FILTERS, hasActiveFilters,
  SortSelect, ListingResults, type ListingFilterState,
} from "@/src/features/product/components/listing";

type Props = { initialCategory?: string; initialSearch?: string; companyId?: string };

export const PublicMarketplace = ({ initialCategory = "", initialSearch = "", companyId }: Props) => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<ListingFilterState>({ ...EMPTY_LISTING_FILTERS, category: initialCategory });
  const [sort, setSort] = useState<ProductSort | "">("");
  const [total, setTotal] = useState(0);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounce search input, sync to URL so search results are shareable.
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const q = searchInput.trim();
      setSearch(q);
      if (!companyId && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
        router.replace(url.pathname + (url.search || ""), { scroll: false });
      }
    }, 320);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput, companyId, router]);

  const activeCat = getCategoryMeta(filters.category);
  const priceMin = filters.priceMin ? parseFloat(filters.priceMin) : undefined;
  const priceMax = filters.priceMax ? parseFloat(filters.priceMax) : undefined;

  return (
    <div>
      {/* Page hero */}
      <div className="border-b px-6 py-8 lg:px-10" style={{ borderColor: "var(--border)", background: "linear-gradient(160deg, #f8fafb 0%, #f0f9ff 100%)" }}>
        <div className="mx-auto max-w-[1400px]">
          {activeCat ? (
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl" style={{ backgroundColor: activeCat.bg }}>
                {activeCat.icon}
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Category</p>
                <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{activeCat.title}</h1>
                <p className="text-sm" style={{ color: "var(--medium-gray)" }}>{total} product{total !== 1 ? "s" : ""} from Indian manufacturers</p>
              </div>
              <button type="button" onClick={() => setFilters((f) => ({ ...f, category: "" }))}
                className="ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}>
                ✕ Clear filter
              </button>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Marketplace</p>
              <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Browse products</h1>
              <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
                {total > 0 ? `${total.toLocaleString("en-IN")} products` : "Explore"} from verified Indian manufacturers
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">
        {/* Search + Sort bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={() => setFilterSheetOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold lg:hidden"
            style={{ border: `1px solid ${hasActiveFilters(filters) ? "var(--primary)" : "var(--border)"}`, color: hasActiveFilters(filters) ? "var(--primary)" : "var(--foreground)", backgroundColor: "var(--surface)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Filters {hasActiveFilters(filters) && "•"}
          </button>
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products by name, SKU, description…"
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }} />
          </div>
          <SortSelect value={sort} onChange={setSort} />
        </div>

        <div className="flex items-start gap-6">
          <FilterSidebar
            value={filters}
            onChange={setFilters}
            availableLocations={availableLocations}
            open={filterSheetOpen}
            onClose={() => setFilterSheetOpen(false)}
          />

          <div className="min-w-0 flex-1">
            <p className="mb-3 text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>
              {total.toLocaleString("en-IN")} products{activeCat ? ` in ${activeCat.title}` : ""}{search ? ` matching "${search}"` : ""}
            </p>

            <ListingResults
              category={filters.category}
              search={search}
              sort={sort}
              stockFilter={filters.stockFilter}
              priceMin={priceMin}
              priceMax={priceMax}
              companyId={companyId}
              location={filters.location}
              verifiedOnly={filters.verifiedOnly}
              emptySubtitle={search ? `No results for "${search}"` : hasActiveFilters(filters) ? "Try adjusting your filters." : "No products in this category yet."}
              onLocationsChange={setAvailableLocations}
              onTotalChange={setTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
