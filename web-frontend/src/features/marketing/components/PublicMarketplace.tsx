"use client";

import { useState } from "react";
import type { ProductSort } from "@/src/types/product";
import { getCategoryMeta } from "@/src/features/product/utils/categories";
import { SearchBar, useUrlSearchQuery } from "@/src/features/search";
import {
  FilterSidebar, EMPTY_LISTING_FILTERS, hasActiveFilters,
  SortSelect, ListingResults, type ListingFilterState,
} from "@/src/features/product/components/listing";

type Props = { initialCategory?: string; companyId?: string };

export const PublicMarketplace = ({ initialCategory = "", companyId }: Props) => {
  // The URL is the source of truth for the query, so a search submitted from
  // the global topbar while already on this page, a shared link, and browser
  // back/forward all drive the results. This used to be
  // `useState(initialSearch)` — read once at mount — so none of those worked.
  // A seller storefront (companyId) keeps its query local instead of writing
  // to the shared `?q=`.
  const { input: searchInput, setInput: setSearchInput, query: search, submit: submitSearch } =
    useUrlSearchQuery({ syncToUrl: !companyId });

  const [filters, setFilters] = useState<ListingFilterState>({ ...EMPTY_LISTING_FILTERS, category: initialCategory });
  const [sort, setSort] = useState<ProductSort | "">("");
  const [total, setTotal] = useState(0);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

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
          <SearchBar
            size="md"
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder="Search products by name, SKU, description…"
            className="flex-1"
          />
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
