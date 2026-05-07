"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductDetailContainer } from "./ProductDetailContainer";

export const ProductDetailPageClient = () => {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId")?.trim() ?? "";

  if (!productId) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Product not found
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
          Missing product id in the page link.
        </p>
        <Link
          href="/dashboard/products"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--primary)", color: "#fff" }}
        >
          ← Back to products
        </Link>
      </div>
    );
  }

  return <ProductDetailContainer productId={productId} />;
};
