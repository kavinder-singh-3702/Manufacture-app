"use client";

import { useEffect, useState } from "react";
import { productService } from "@/src/services/product";
import { isAbortError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import type { CampaignWizardApi } from "../useCampaignWizard";
import { Field, Section, TextInput } from "../adStudioShared";

export const ProductStep = ({ wizard }: { wizard: CampaignWizardApi }) => {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const needsOwner = wizard.productSource === "user_listings" && !wizard.ownerUserId;

  useEffect(() => {
    if (wizard.adSource !== "internal" || needsOwner) { setProducts([]); return; }
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      productService.list({
        scope: "marketplace",
        status: "active",
        visibility: "public",
        createdByRole: wizard.productSource === "user_listings" ? "user" : "admin",
        // `createdBy` is an admin-only filter the shared ListProductsParams
        // type doesn't declare (see product.controller.js: restricted to
        // admin users) — this screen is admin-only, so it's safe to send.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(wizard.productSource === "user_listings" ? { createdBy: wizard.ownerUserId } : {}) as any,
        search: search.trim() || undefined,
        limit: 40,
      }, controller.signal)
        .then((res) => { if (active) setProducts(res.products ?? []); })
        .catch((err) => { if (active && !isAbortError(err)) setProducts([]); })
        .finally(() => { if (active) setLoading(false); });
    }, search ? 250 : 0);
    return () => { active = false; clearTimeout(t); controller.abort(); };
  }, [wizard.adSource, wizard.productSource, wizard.ownerUserId, needsOwner, search]);

  if (wizard.adSource === "external") {
    return (
      <Section>
        <div className="rounded-xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>No product needed</p>
          <p className="mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>
            External campaigns link out to {wizard.destinationUrl || "a third-party URL"} — nothing to pick here. Continue to Audience.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <Field label="Search products">
        <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, SKU, category" />
      </Field>

      {needsOwner ? (
        <p className="rounded-xl p-3 text-sm" style={{ border: "1px dashed var(--border)", color: "var(--medium-gray)" }}>
          Select an owner in the Source &amp; Owner step to load their products.
        </p>
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
        </div>
      ) : !products.length ? (
        <p className="rounded-xl p-3 text-sm" style={{ border: "1px dashed var(--border)", color: "var(--medium-gray)" }}>
          No eligible products found for this source.
        </p>
      ) : (
        <div className="max-h-80 space-y-1.5 overflow-y-auto">
          {products.map((p) => {
            const active = wizard.productId === p._id;
            return (
              <button key={p._id} type="button" onClick={() => wizard.setProduct(p)}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all"
                style={{
                  border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                  backgroundColor: active ? "var(--primary-light)" : "var(--surface)",
                }}>
                {p.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" decoding="async" src={p.images[0].url} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--background)" }}>📦</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: active ? "var(--primary)" : "var(--foreground)" }}>{p.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--medium-gray)" }}>
                    ₹{p.price.amount.toLocaleString("en-IN")} · {p.category}{p.subCategory ? ` · ${p.subCategory}` : ""}
                  </p>
                </div>
                {active && <span className="flex-shrink-0 text-sm font-bold" style={{ color: "var(--primary)" }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {wizard.productDisplay && (
        <div className="flex items-center gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
          {wizard.productDisplay.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={wizard.productDisplay.image} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--surface)" }}>📦</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Selected product</p>
            <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{wizard.productDisplay.name}</p>
          </div>
        </div>
      )}
    </Section>
  );
};
